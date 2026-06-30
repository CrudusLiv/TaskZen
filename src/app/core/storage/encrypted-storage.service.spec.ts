import { EncryptedStorageService } from './encrypted-storage.service';

interface FakeSnapshot {
  [key: string]: unknown;
  version: number;
  items: Record<string, number>;
  energy: Record<string, never>;
  routines: unknown[];
  focus: Record<string, never>;
  coach?: { tips: unknown[] };
  preferences?: { theme: string };
}

function baseSnap(): FakeSnapshot {
  return {
    version: 1,
    items: { a: 1 },
    energy: {},
    routines: [],
    focus: {},
    coach: { tips: [] },
    preferences: { theme: 'dark' },
  };
}

describe('EncryptedStorageService', () => {
  let svc: EncryptedStorageService;

  beforeEach(async () => {
    svc = new EncryptedStorageService();
    // Assign unique DB per test for isolation; key store uses ${dbName}_keys automatically
    svc.setDbName('taskzen_store_test_' + crypto.getRandomValues(new Uint32Array(1))[0]);
    svc.setKdfIterations(5000); // speed up tests (only applies to v2 migration reads)
  });

  it('round-trips save -> load', async () => {
    const snap = baseSnap();
    await svc.save(snap);
    const loaded = await svc.load();
    expect(loaded).toBeTruthy();
    expect((loaded as FakeSnapshot | null)?.version).toBe(1);
    expect((loaded as FakeSnapshot | null)?.items).toEqual({ a: 1 });
    expect((loaded as FakeSnapshot | null)?.preferences?.theme).toBe('dark');
    expect((loaded as { savedAt?: string } | null)?.savedAt).toBeTruthy();
  });

  it('export then import persists data', async () => {
    const snap = baseSnap();
    await svc.save(snap);
    const exported = await svc.export();
    // clear underlying storage by reinitializing DB (simplistic: overwrite with new payload)
    await svc.save({ ...snap, items: { a: 2 } });
    await svc.import(exported);
    const loaded = await svc.load();
    expect((loaded as FakeSnapshot | null)?.items).toEqual({ a: 1 });
  });

  it('tampered ciphertext causes load to throw', async () => {
    const snap = baseSnap();
    await svc.save(snap);
    // Directly get packed string via export(local) path: load then mimic DB corruption.
    const svcAsRecord = svc as unknown as Record<string, unknown>;
    const dbAny = svcAsRecord['dbPromise']
      ? await (svcAsRecord['dbPromise'] as Promise<unknown>)
      : await (svcAsRecord['db'] as Promise<unknown>);
    const dbWithGet = dbAny as {
      get(store: string, key: string): Promise<string>;
      put(store: string, value: string, key: string): Promise<void>;
    };
    const packed: string = await dbWithGet.get('kv', 'main');
    // Tamper a byte: flip middle char for higher chance of auth tag failure
    const mid = Math.floor(packed.length / 2);
    const origChar = packed[mid];
    const tamperedChar = origChar === 'A' ? 'B' : 'A';
    const tampered = packed.slice(0, mid) + tamperedChar + packed.slice(mid + 1);
    await dbWithGet.put('kv', tampered, 'main');
    // Should now throw instead of silently returning null
    await expectAsync(svc.load()).toBeRejected();
  });

  it('invalid import rejects', async () => {
    await expectAsync(svc.import('eyJub3QiOiBqc29ufQ==')).toBeRejected();
  });
});

// Increase timeout for slower crypto/IndexedDB in CI
(jasmine as unknown as { DEFAULT_TIMEOUT_INTERVAL: number }).DEFAULT_TIMEOUT_INTERVAL = 15000;
