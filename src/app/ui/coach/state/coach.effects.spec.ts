import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { ReplaySubject } from 'rxjs';
import { CoachEffects } from './coach.effects';
import { CoachActions, CoachCard } from './coach.actions';
import { EnergyLog } from '../../energy/state/energy.actions';
import { ItemEntity } from '../../items/state/items.actions';

// Feature keys must match NgRx feature key strings used in selectors
// focusFeatureKey = 'focusSession', routinesFeatureKey = 'routines', etc.
const INITIAL_STATE = {
  items: { entities: {}, order: [] },
  routines: { entities: {}, order: [] },
  energy: { logs: [] },
  focusSession: { current: undefined, history: [], dayStreak: 0, lastSessionDate: undefined },
  coach: { cards: [] },
  preferences: {},
};

function makeEnergyLog(level: 1 | 2 | 3 | 4 | 5): EnergyLog {
  return {
    id: crypto.randomUUID(),
    level,
    moods: [],
    createdAt: new Date().toISOString(),
  };
}

function makeItem(overrides: Partial<ItemEntity> = {}): ItemEntity {
  return {
    id: crypto.randomUUID(),
    title: 'Test item',
    status: 'inbox',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildTestBed(actions$: ReplaySubject<Action>) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      CoachEffects,
      provideMockActions(() => actions$),
      provideMockStore({ initialState: INITIAL_STATE }),
    ],
  });
  return {
    effects: TestBed.inject(CoachEffects),
    store: TestBed.inject(MockStore),
  };
}

describe('CoachEffects', () => {
  let actions$: ReplaySubject<Action>;

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    TestBed.resetTestingModule();
  });

  describe('tickEval$', () => {
    it('emits CoachActions.evaluateRules after 4000ms initial delay', (done) => {
      // Install clock BEFORE creating the effect so timer() picks it up
      jasmine.clock().install();

      const { effects } = buildTestBed(actions$);

      const dispatched: Action[] = [];
      effects.tickEval$.subscribe((a) => dispatched.push(a));

      jasmine.clock().tick(3999);
      expect(dispatched.length).toBe(0);

      jasmine.clock().tick(1);
      expect(dispatched.length).toBeGreaterThanOrEqual(1);
      expect(dispatched[0].type).toBe(CoachActions.evaluateRules.type);

      done();
    });
  });

  describe('evaluate$', () => {
    it('dispatches addCard with category Energy and ruleId low-energy when latest energy level <= 2', (done) => {
      jasmine.clock().install();
      // Midday — only low-energy rule fires (not morning/peak/evening)
      jasmine.clock().mockDate(new Date('2026-01-15T12:00:00'));

      const { effects, store } = buildTestBed(actions$);

      store.setState({
        ...INITIAL_STATE,
        energy: { logs: [makeEnergyLog(1)] },
        coach: { cards: [] },
      });

      const dispatched: Action[] = [];
      effects.evaluate$.subscribe({
        next: (a) => {
          dispatched.push(a);
          const addCard = a as ReturnType<typeof CoachActions.addCard>;
          if (addCard.card?.ruleId === 'low-energy') {
            expect(addCard.type).toBe(CoachActions.addCard.type);
            expect(addCard.card.category).toBe('Energy');
            expect(addCard.card.ruleId).toBe('low-energy');
            done();
          }
        },
        error: done.fail,
      });

      actions$.next(CoachActions.evaluateRules());
    });

    it('dispatches morning-intention card when hour is 7 and no items done today', (done) => {
      jasmine.clock().install();
      // 07:00 — isMorning is true (6 <= h < 10)
      jasmine.clock().mockDate(new Date('2026-01-15T07:00:00'));

      const { effects, store } = buildTestBed(actions$);

      const itemId = 'i1';
      store.setState({
        ...INITIAL_STATE,
        energy: { logs: [] }, // no energy log — avoids low-energy/peak rules
        items: {
          entities: { [itemId]: makeItem({ id: itemId, status: 'inbox' }) },
          order: [itemId],
        },
        coach: { cards: [] },
      });

      const dispatched: Action[] = [];
      effects.evaluate$.subscribe({
        next: (a) => {
          dispatched.push(a);
          const addCard = a as ReturnType<typeof CoachActions.addCard>;
          if (addCard.card?.ruleId === 'morning-intention') {
            expect(addCard.card.category).toBe('Focus');
            expect(addCard.card.ruleId).toBe('morning-intention');
            done();
          }
        },
        error: done.fail,
      });

      actions$.next(CoachActions.evaluateRules());
    });

    it('does NOT re-dispatch a card whose ruleId already exists in coach.cards within the last hour', (done) => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2026-01-15T12:00:00'));

      const { effects, store } = buildTestBed(actions$);

      const existingCard: CoachCard = {
        id: crypto.randomUUID(),
        category: 'Energy',
        title: 'Energy is low',
        body: 'Consider a short recharge.',
        suggestion: 'Log a reset after your break',
        ruleId: 'low-energy',
        createdAt: new Date().toISOString(), // within last hour
      };

      store.setState({
        ...INITIAL_STATE,
        energy: { logs: [makeEnergyLog(1)] }, // would trigger low-energy
        coach: { cards: [existingCard] }, // but card already exists — dedup fires
      });

      const dispatched: Action[] = [];
      const sub = effects.evaluate$.subscribe((a) => dispatched.push(a));
      actions$.next(CoachActions.evaluateRules());

      // Tick through synchronous microtask scheduling; store.select is synchronous
      // so the effect chain resolves without real async
      jasmine.clock().tick(100);

      sub.unsubscribe();
      const lowEnergyCards = dispatched.filter(
        (a) => (a as ReturnType<typeof CoachActions.addCard>).card?.ruleId === 'low-energy',
      );
      expect(lowEnergyCards.length).toBe(0);
      done();
    });
  });
});
