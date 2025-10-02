import { EncryptedStorageService } from './encrypted-storage.service';

interface FakeSnapshot {
  version: number;
  items: any;
  energy: any;
  routines: any;
  focus: any;
  coach?: any;
  preferences?: any;
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
    // Assign unique DB per test for isolation
    svc.setDbName('taskzen_store_test_' + crypto.getRandomValues(new Uint32Array(1))[0]);
    svc.setPassphrase('test-pass');
    svc.setKdfIterations(5000); // speed up tests
  });

  it('round-trips save -> load', async () => {
    const snap = baseSnap();
    await svc.save(snap);
    const loaded = await svc.load();
    expect(loaded).toBeTruthy();
    expect(loaded?.version).toBe(1);
    expect(loaded?.items).toEqual({ a: 1 });
    expect(loaded?.preferences?.theme).toBe('dark');
    expect(loaded?.savedAt).toBeTruthy();
  });

  it('export then import persists data', async () => {
    const snap = baseSnap();
    await svc.save(snap);
    const exported = await svc.export();
    // clear underlying storage by reinitializing DB (simplistic: overwrite with new payload)
    await svc.save({ ...snap, items: { a: 2 } });
    await svc.import(exported);
    const loaded = await svc.load();
    expect(loaded?.items).toEqual({ a: 1 });
  });

  it('tampered ciphertext causes load to return null', async () => {
    const snap = baseSnap();
    await svc.save(snap);
    // Directly get packed string via export(local) path: load then mimic DB corruption.
    const dbAny: any = (svc as any).dbPromise
      ? await (svc as any).dbPromise
      : await (svc as any).db;
    const packed: string = await dbAny.get('kv', 'main');
    // Tamper a byte: flip middle char for higher chance of auth tag failure
    const mid = Math.floor(packed.length / 2);
    const origChar = packed[mid];
    const tamperedChar = origChar === 'A' ? 'B' : 'A';
    const tampered = packed.slice(0, mid) + tamperedChar + packed.slice(mid + 1);
    await dbAny.put('kv', tampered, 'main');
    const loaded = await svc.load();
    // Should swallow error and return null
    expect(loaded).toBeNull();
  });

  it('invalid import rejects', async () => {
    await expectAsync(svc.import('eyJub3QiOiBqc29ufQ==')).toBeRejected();
  });
});

// Increase timeout for slower crypto/IndexedDB in CI
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(jasmine as any).DEFAULT_TIMEOUT_INTERVAL = 15000;
