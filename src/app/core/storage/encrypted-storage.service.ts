import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';

interface PersistSnapshot {
  version: number;
  items: any;
  energy: any;
  routines: any;
  focus: any;
  coach?: any;
  preferences?: any;
  savedAt: string;
}

// Encryption formats:
// v1 (legacy): base64([IV(12)|CIPHERTEXT]) key = SHA-256(seed)
// v2 (current): base64([0x02|SALT(16)|IV(12)|CIPHERTEXT]) key = PBKDF2(passphrase,salt,iterations)->AES-GCM
// On load: if first byte == 0x02 treat as v2 else attempt legacy v1.
const DEFAULT_DB_NAME = 'taskzen_store';
const DB_VERSION = 1;
const STORE = 'kv';
const KEY_ID = 'main';

@Injectable({ providedIn: 'root' })
export class EncryptedStorageService {
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private cryptoKey: CryptoKey | null = null; // unused now (legacy helper retained below)
  private dbName: string = DEFAULT_DB_NAME;
  private legacyKey: CryptoKey | null = null;
  private passphrase = 'taskzen-default-passphrase';
  private kdfIterations = 120000; // lowered a bit for responsiveness
  private static readonly VERSION_V2 = 0x02;
  // Test hook: allow overriding DB name before first use
  setDbName(name: string) {
    if (this.dbPromise) throw new Error('DB already opened');
    this.dbName = name;
  }

  private get db() {
    if (!this.dbPromise) {
      this.dbPromise = openDB(this.dbName, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        },
      });
    }
    return this.dbPromise;
  }

  setPassphrase(pass: string) {
    this.passphrase = pass || 'taskzen-default-passphrase';
  }
  setKdfIterations(iter: number) {
    this.kdfIterations = iter;
  }

  private async legacyEnsureKey(): Promise<CryptoKey> {
    if (this.legacyKey) return this.legacyKey;
    const encoder = new TextEncoder();
    const seed = 'taskzen-static-seed-v1';
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(seed));
    this.legacyKey = await crypto.subtle.importKey('raw', hash, 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
    return this.legacyKey;
  }
  private async deriveV2Key(salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(this.passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: this.kdfIterations,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async save(snapshot: Omit<PersistSnapshot, 'savedAt'>) {
    const payload: PersistSnapshot = { ...snapshot, savedAt: new Date().toISOString() };
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveV2Key(salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
    );
    const packed = this.packV2(salt, iv, cipher);
    await (await this.db).put(STORE, packed, KEY_ID);
  }

  async load(): Promise<PersistSnapshot | null> {
    try {
      const packed = await (await this.db).get(STORE, KEY_ID);
      if (!packed) return null;
      const bytes = this.b64ToBytes(packed);
      if (bytes[0] === EncryptedStorageService.VERSION_V2) {
        const { salt, iv, cipher } = this.unpackV2(bytes);
        const key = await this.deriveV2Key(salt);
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
        const json = new TextDecoder().decode(plainBuf);
        return JSON.parse(json);
      } else {
        const { iv, cipher } = this.unpackV1(bytes);
        const key = await this.legacyEnsureKey();
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
        const json = new TextDecoder().decode(plainBuf);
        return JSON.parse(json);
      }
    } catch (e) {
      console.error('[storage] load failed — data could not be decrypted or read', e);
      throw e;
    }
  }

  async export(): Promise<string> {
    const snap = await this.load();
    return btoa(unescape(encodeURIComponent(JSON.stringify(snap))));
  }

  async import(data: string) {
    try {
      const json = decodeURIComponent(escape(atob(data)));
      const parsed = JSON.parse(json);
      // simple validation
      if (!parsed || typeof parsed !== 'object' || !('version' in parsed))
        throw new Error('invalid');
      // re-save to ensure encryption with local key
      await this.save(parsed);
    } catch (e) {
      console.error('[storage] import failed', e);
      throw e;
    }
  }

  private packV2(salt: Uint8Array, iv: Uint8Array, cipher: Uint8Array): string {
    const merged = new Uint8Array(1 + salt.length + iv.length + cipher.length);
    merged[0] = EncryptedStorageService.VERSION_V2;
    merged.set(salt, 1);
    merged.set(iv, 1 + salt.length);
    merged.set(cipher, 1 + salt.length + iv.length);
    return this.bytesToB64(merged);
  }
  private unpackV2(bytes: Uint8Array) {
    return { salt: bytes.slice(1, 17), iv: bytes.slice(17, 29), cipher: bytes.slice(29) };
  }
  private unpackV1(bytes: Uint8Array) {
    return { iv: bytes.slice(0, 12), cipher: bytes.slice(12) };
  }
  private b64ToBytes(b64: string) {
    return new Uint8Array(
      atob(b64)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
  }
  private bytesToB64(bytes: Uint8Array) {
    return btoa(String.fromCharCode(...bytes));
  }
}
