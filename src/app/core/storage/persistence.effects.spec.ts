import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { ReplaySubject } from 'rxjs';
import { PersistenceEffects } from './persistence.effects';
import { EncryptedStorageService } from './encrypted-storage.service';
import { StorageErrorService } from './storage-error.service';
import { ItemsActions } from '../../ui/items/state/items.actions';
import { EnergyActions } from '../../ui/energy/state/energy.actions';
import { RoutinesActions } from '../../ui/routines/state/routines.actions';
import { FocusActions } from '../../ui/focus/state/focus.actions';
import { CoachActions } from '../../ui/coach/state/coach.actions';
import { PreferencesActions } from '../../ui/preferences/state/preferences.actions';

// Feature keys must match the NgRx feature key strings used in selectors
const INITIAL_STATE = {
  items: { entities: {}, order: [] },
  routines: { entities: {}, order: [] },
  energy: { logs: [] },
  focusSession: { current: undefined, history: [], dayStreak: 0, lastSessionDate: undefined },
  coach: { cards: [] },
  preferences: {},
};

describe('PersistenceEffects', () => {
  let actions$: ReplaySubject<Action>;
  let effects: PersistenceEffects;
  let storageSpy: jasmine.SpyObj<EncryptedStorageService>;
  let storageErrorSpy: jasmine.SpyObj<StorageErrorService>;

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);

    storageSpy = jasmine.createSpyObj<EncryptedStorageService>('EncryptedStorageService', [
      'load',
      'save',
    ]);
    storageErrorSpy = jasmine.createSpyObj<StorageErrorService>('StorageErrorService', [
      'showLoadError',
    ]);

    storageSpy.load.and.returnValue(Promise.resolve(null));
    storageSpy.save.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        PersistenceEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: INITIAL_STATE }),
        { provide: EncryptedStorageService, useValue: storageSpy },
        { provide: StorageErrorService, useValue: storageErrorSpy },
      ],
    });

    effects = TestBed.inject(PersistenceEffects);
  });

  describe('hydrate$', () => {
    it('dispatches 6 hydrate actions when storage returns a valid snapshot', (done) => {
      const snapshot = {
        version: 3,
        savedAt: new Date().toISOString(),
        items: [],
        energy: { logs: [] },
        routines: { list: [] },
        focus: { current: undefined, history: [], dayStreak: 0 },
        coach: { cards: [] },
        preferences: {},
      };
      storageSpy.load.and.returnValue(Promise.resolve(snapshot));

      const dispatched: Action[] = [];
      effects.hydrate$.subscribe({
        next: (a) => {
          dispatched.push(a);
          if (dispatched.length === 6) {
            const types = dispatched.map((x) => x.type);
            expect(types).toContain(ItemsActions.hydrate.type);
            expect(types).toContain(EnergyActions.hydrate.type);
            expect(types).toContain(RoutinesActions.hydrate.type);
            expect(types).toContain(FocusActions.hydrate.type);
            expect(types).toContain(CoachActions.hydrate.type);
            expect(types).toContain(PreferencesActions.hydrate.type);
            done();
          }
        },
        error: done.fail,
      });

      actions$.next(ItemsActions.init());
    });

    it('dispatches nothing when storage.load() returns null', (done) => {
      storageSpy.load.and.returnValue(Promise.resolve(null));

      const dispatched: Action[] = [];
      effects.hydrate$.subscribe((a) => dispatched.push(a));

      actions$.next(ItemsActions.init());

      // Wait two microtask turns for the Promise and operators to resolve
      Promise.resolve()
        .then(() => Promise.resolve())
        .then(() => {
          expect(dispatched.length).toBe(0);
          done();
        });
    });

    it('calls storageError.showLoadError() and does not error the stream when load throws', (done) => {
      storageSpy.load.and.returnValue(Promise.reject(new Error('decrypt failed')));

      let streamErrored = false;
      const dispatched: Action[] = [];

      effects.hydrate$.subscribe({
        next: (a) => dispatched.push(a),
        error: () => {
          streamErrored = true;
        },
      });

      actions$.next(ItemsActions.init());

      // Give the rejected promise time to settle
      setTimeout(() => {
        expect(streamErrored).toBeFalse();
        expect(dispatched.length).toBe(0);
        expect(storageErrorSpy.showLoadError).toHaveBeenCalled();
        done();
      }, 50);
    });
  });

  describe('save$', () => {
    it('calls storage.save() with correct snapshot shape after 400ms debounce', (done) => {
      effects.save$.subscribe();

      actions$.next(ItemsActions.addItem({ title: 'Test task' }));

      // Before debounce: save should NOT have been called
      setTimeout(() => {
        expect(storageSpy.save).not.toHaveBeenCalled();
      }, 200);

      // After debounce: save SHOULD have been called with correct shape
      setTimeout(() => {
        expect(storageSpy.save).toHaveBeenCalledTimes(1);
        const savedArg = storageSpy.save.calls.mostRecent().args[0] as Record<string, unknown>;
        expect(savedArg['version']).toBe(3);
        expect(savedArg['items']).toBeDefined();
        expect(savedArg['energy']).toBeDefined();
        expect(savedArg['routines']).toBeDefined();
        expect(savedArg['focus']).toBeDefined();
        expect(savedArg['coach']).toBeDefined();
        expect(savedArg['preferences']).toBeDefined();
        done();
      }, 500);
    });

    it('debounces multiple rapid save actions into a single call', (done) => {
      effects.save$.subscribe();

      // Fire three actions in quick succession
      actions$.next(ItemsActions.addItem({ title: 'Task 1' }));
      setTimeout(() => actions$.next(ItemsActions.addItem({ title: 'Task 2' })), 50);
      setTimeout(() => actions$.next(ItemsActions.addItem({ title: 'Task 3' })), 100);

      // 600ms after the last action: debounce has settled, should only see 1 call
      setTimeout(() => {
        expect(storageSpy.save).toHaveBeenCalledTimes(1);
        done();
      }, 600);
    });
  });
});
