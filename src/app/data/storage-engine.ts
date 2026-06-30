// Storage abstraction layer for TaskZen (offline-first with future Firestore adapter)
// Focus: pluggable engines (IndexedDB encrypted, Firestore remote sync), versioned migrations.

import { RootDataSnapshotV2 } from './schema-v2';

export interface StorageEngine {
  init(): Promise<void>;
  loadSnapshot(): Promise<RootDataSnapshotV2 | null>; // null if empty
  saveSnapshot(snapshot: RootDataSnapshotV2): Promise<void>;
  exportRaw(): Promise<Blob>; // encrypted blob for download
  importRaw(blob: Blob): Promise<void>; // replace existing data with imported (after decrypt)
  clear(): Promise<void>;
  engineKind(): 'indexeddb' | 'firestore' | 'memory';
}

// Encryption responsibilities are separated so that engines can focus on persistence shape.
export interface CryptoProvider {
  deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey>;
  generateSalt(): Uint8Array;
  encrypt(key: CryptoKey, data: Uint8Array): Promise<{ iv: Uint8Array; cipher: Uint8Array }>;
  decrypt(key: CryptoKey, iv: Uint8Array, cipher: Uint8Array): Promise<Uint8Array>;
}

export interface KeyManager {
  currentKey(): CryptoKey | null;
  setKey(key: CryptoKey): void;
  clearKey(): void;
}

export interface Migration {
  from: number; // previous version
  to: number; // next version
  run(raw: Record<string, unknown>): Record<string, unknown>; // transform root snapshot-like structure
}

export interface MigrationRegistry {
  applyAll(snapshot: Record<string, unknown>): Record<string, unknown>; // returns migrated structure
}

// Helper result for partial slice hydration
export interface HydrationSlices {
  items?: unknown;
  focusSessions?: unknown;
  energyLogs?: unknown;
  routines?: unknown;
  routineRuns?: unknown;
  coachPrompts?: unknown;
  insights?: unknown;
}

export interface PersistenceOrchestrator {
  init(engine: StorageEngine): Promise<void>;
  hydrateToStore(): Promise<void>;
  scheduleAutoSave(intervalMs?: number): void;
  flushNow(): Promise<void>;
}
