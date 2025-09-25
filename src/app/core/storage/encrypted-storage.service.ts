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

// Lightweight key management: for now derive a transient key from a static salt + device fingerprint placeholder.
// Later: prompt user for passphrase & rotate.
const DB_NAME = 'taskzen_store';
const DB_VERSION = 1;
const STORE = 'kv';
const KEY_ID = 'main';

@Injectable({ providedIn: 'root' })
export class EncryptedStorageService {
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private cryptoKey: CryptoKey | null = null;

  private get db() {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        },
      });
    }
    return this.dbPromise;
  }

  async ensureKey(): Promise<CryptoKey> {
    if (this.cryptoKey) return this.cryptoKey;
    const raw = await this.deriveKeyMaterial();
    this.cryptoKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
    return this.cryptoKey;
  }

  private async deriveKeyMaterial(): Promise<ArrayBuffer> {
    // Placeholder derivation: previously returned raw seed (22 bytes) which is not a valid AES key length.
    // For now, derive a 256-bit key by hashing the static seed with SHA-256 (output = 32 bytes).
    // TODO: Replace with PBKDF2(passphrase, salt, iterations) -> importKey('raw', derivedBits, 'AES-GCM', ...)
    const encoder = new TextEncoder();
    const seed = 'taskzen-static-seed-v1';
    const data = encoder.encode(seed);
    return await crypto.subtle.digest('SHA-256', data);
  }

  async save(snapshot: Omit<PersistSnapshot, 'savedAt'>) {
    const key = await this.ensureKey();
    const payload: PersistSnapshot = { ...snapshot, savedAt: new Date().toISOString() };
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
    );
    const packed = this.pack(iv, cipher);
    (await this.db).put(STORE, packed, KEY_ID);
  }

  async load(): Promise<PersistSnapshot | null> {
    try {
      const packed = await (await this.db).get(STORE, KEY_ID);
      if (!packed) return null;
      const { iv, cipher } = this.unpack(packed);
      const key = await this.ensureKey();
      const plainBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        key,
        cipher as unknown as BufferSource
      );
      const json = new TextDecoder().decode(plainBuf);
      return JSON.parse(json);
    } catch (e) {
      console.warn('[storage] load failed', e);
      return null;
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

  private pack(iv: Uint8Array, cipher: Uint8Array): string {
    const merged = new Uint8Array(iv.length + cipher.length);
    merged.set(iv, 0);
    merged.set(cipher, iv.length);
    return btoa(String.fromCharCode(...merged));
  }
  private unpack(packed: string): { iv: Uint8Array; cipher: Uint8Array } {
    const bytes = new Uint8Array(
      atob(packed)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
    const iv = bytes.slice(0, 12);
    const cipher = bytes.slice(12);
    return { iv, cipher };
  }
}
