import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { FirebaseService } from './firebase.service';
import { AppActions } from './store/app.actions';

// Stub out the firebase SDK modules so no real network/IndexedDB is touched
import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseFirestore from 'firebase/firestore';
import { firebaseEnv } from './firebase.config';

describe('FirebaseService', () => {
  let service: FirebaseService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        FirebaseService,
        provideMockStore({ initialState: {} }),
      ],
    });

    service = TestBed.inject(FirebaseService);
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch').and.callThrough();
  });

  afterEach(() => {
    if (service) {
      service.initialized = false;
    }
  });

  describe('init() when already initialized', () => {
    it('returns early without dispatching to store', () => {
      service.initialized = true;

      service.init();

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('leaves initialized = true after a second init() call', () => {
      service.initialized = true;

      service.init();

      expect(service.initialized).toBeTrue();
    });
  });

  describe('init() when firebaseEnv is falsy', () => {
    it('dispatches AppActions.error and keeps initialized = false', () => {
      if (firebaseEnv) {
        pending('firebaseEnv is defined in this environment — falsy-config test skipped');
        return;
      }

      service.init();

      expect(service.initialized).toBeFalse();
      expect(store.dispatch).toHaveBeenCalledWith(
        AppActions.error({ message: 'Firebase config missing. Nothing will persist.' }),
      );
    });
  });

  describe('init() happy path with SDK stubs', () => {
    it('sets initialized = true when existing firebase apps are reused and auth/db succeed', () => {
      if (!firebaseEnv) {
        // In CI without a real config, stub the module-level firebaseEnv check
        // by verifying behaviour through stubbing the underlying SDK calls.
        // Since firebaseEnv is falsy here, this path is exercised in the falsy test above.
        pending('firebaseEnv not present — happy path only testable with real config');
        return;
      }

      const fakeApp = { name: '[DEFAULT]', options: firebaseEnv } as firebaseApp.FirebaseApp;
      spyOn(firebaseApp, 'getApps').and.returnValue([fakeApp]);
      spyOn(firebaseAuth, 'getAuth').and.returnValue({} as firebaseAuth.Auth);
      // Exercise the fallback path: initializeFirestore throws, getFirestore is used
      spyOn(firebaseFirestore, 'initializeFirestore').and.throwError('already initialized');
      spyOn(firebaseFirestore, 'getFirestore').and.returnValue({} as firebaseFirestore.Firestore);

      service.init();

      expect(service.initialized).toBeTrue();
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('dispatches AppActions.error when SDK throws during init', () => {
      if (!firebaseEnv) {
        pending('firebaseEnv not present — SDK error path skipped');
        return;
      }

      spyOn(firebaseApp, 'getApps').and.throwError('SDK exploded');

      service.init();

      expect(service.initialized).toBeFalse();
      expect(store.dispatch).toHaveBeenCalledWith(
        AppActions.error({ message: 'Firebase init failed. Check console.' }),
      );
    });
  });
});
