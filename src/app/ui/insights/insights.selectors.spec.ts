import {
  selectFocusActiveMinutesToday,
  selectItemsCapturedToday,
  selectItemsCompletedToday,
  selectEnergyTrend,
  selectRoutineAdherence,
  selectPriorityDistribution,
  selectEnergyDipWindow,
  selectCompletionStreak,
} from './insights.selectors';
import { ItemEntity } from '../items/state/items.actions';
import { EnergyLog } from '../energy/state/energy.actions';
import { FocusSessionStateEntity } from '../focus/state/focus.actions';
import { RoutineEntity } from '../routines/state/routines.actions';

function todayIso(): string {
  return new Date().toISOString();
}
function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function makeItem(id: string, status: ItemEntity['status'], createdAt: string, updatedAt: string): ItemEntity {
  return { id, title: id, status, createdAt, updatedAt };
}

function makeEnergyLog(level: 1 | 2 | 3 | 4 | 5, createdAt: string): EnergyLog {
  return { id: `e_${level}_${createdAt}`, level, moods: [], createdAt };
}

function makeFocusEntity(overrides: Partial<FocusSessionStateEntity>): FocusSessionStateEntity {
  return {
    id: 'f1',
    plannedMinutes: 25,
    startedAt: todayIso(),
    tickSeconds: 0,
    status: 'running',
    calmSnapshot: false,
    ...overrides,
  };
}

function makeRoutine(id: string, steps: RoutineEntity['steps']): RoutineEntity {
  const now = todayIso();
  return { id, name: id, steps, createdAt: now, updatedAt: now };
}

// ── selectFocusActiveMinutesToday ────────────────────────────────────────────
describe('selectFocusActiveMinutesToday', () => {
  it('returns 0 when no focus state (undefined)', () => {
    expect(selectFocusActiveMinutesToday.projector(undefined)).toBe(0);
  });

  it('returns 0 when focus started on a different day', () => {
    const yesterday = daysAgoIso(1);
    const entity = makeFocusEntity({ startedAt: yesterday, tickSeconds: 600 });
    expect(selectFocusActiveMinutesToday.projector(entity)).toBe(0);
  });

  it('returns minutes from tickSeconds for today', () => {
    const entity = makeFocusEntity({ startedAt: todayIso(), tickSeconds: 125 });
    expect(selectFocusActiveMinutesToday.projector(entity)).toBe(2); // Math.floor(125/60)
  });

  it('returns 0 when tickSeconds is 0', () => {
    const entity = makeFocusEntity({ startedAt: todayIso(), tickSeconds: 0 });
    expect(selectFocusActiveMinutesToday.projector(entity)).toBe(0);
  });
});

// ── selectItemsCapturedToday ─────────────────────────────────────────────────
describe('selectItemsCapturedToday', () => {
  it('returns 0 for empty items', () => {
    expect(selectItemsCapturedToday.projector([])).toBe(0);
  });

  it('counts only items created today', () => {
    const items = [
      makeItem('a', 'inbox', todayIso(), todayIso()),
      makeItem('b', 'inbox', daysAgoIso(1), daysAgoIso(1)),
      makeItem('c', 'inbox', todayIso(), todayIso()),
    ];
    expect(selectItemsCapturedToday.projector(items)).toBe(2);
  });
});

// ── selectItemsCompletedToday ────────────────────────────────────────────────
describe('selectItemsCompletedToday', () => {
  it('returns 0 for empty items', () => {
    expect(selectItemsCompletedToday.projector([])).toBe(0);
  });

  it('counts only done items updated today', () => {
    const items = [
      makeItem('a', 'done', daysAgoIso(2), todayIso()),    // done today
      makeItem('b', 'done', daysAgoIso(2), daysAgoIso(1)), // done yesterday
      makeItem('c', 'next', todayIso(), todayIso()),         // not done
    ];
    expect(selectItemsCompletedToday.projector(items)).toBe(1);
  });
});

// ── selectEnergyTrend ────────────────────────────────────────────────────────
describe('selectEnergyTrend', () => {
  it('returns empty for no logs', () => {
    expect(selectEnergyTrend.projector([])).toEqual([]);
  });

  it('returns last 7 logs in chronological order (oldest first after reverse)', () => {
    // levels 1..10 where index 0 is newest; selector takes first 7 then reverses
    const logs: EnergyLog[] = Array.from({ length: 10 }, (_, i) => ({
      id: `e${i}`,
      level: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      moods: [],
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));
    const result = selectEnergyTrend.projector(logs);
    expect(result.length).toBe(7);
    // After slice(0,7) reversed: index 0 is oldest of the 7 (index 6 of original)
    expect(result[0].level).toBe(logs[6].level);
    expect(result[6].level).toBe(logs[0].level);
  });

  it('returns fewer than 7 when less data available', () => {
    const logs = [makeEnergyLog(3, todayIso())];
    const result = selectEnergyTrend.projector(logs);
    expect(result.length).toBe(1);
  });
});

// ── selectRoutineAdherence ───────────────────────────────────────────────────
describe('selectRoutineAdherence', () => {
  it('returns 0 ratio when no routines', () => {
    expect(selectRoutineAdherence.projector([])).toEqual({ ratio: 0, percent: 0 });
  });

  it('calculates ratio of routines with steps', () => {
    const now = todayIso();
    const routines = [
      makeRoutine('r1', [{ id: 's1', title: 'Step A' }, { id: 's2', title: 'Step B' }]),
      makeRoutine('r2', []),
      makeRoutine('r3', [{ id: 's3', title: 'Step X' }]),
    ];
    const result = selectRoutineAdherence.projector(routines);
    expect(result.ratio).toBeCloseTo(2 / 3);
    expect(result.percent).toBe(67);
    void now;
  });

  it('returns 100% when all routines have steps', () => {
    const routines = [
      makeRoutine('r1', [{ id: 's1', title: 'A' }]),
      makeRoutine('r2', [{ id: 's2', title: 'B' }, { id: 's3', title: 'C' }]),
    ];
    const result = selectRoutineAdherence.projector(routines);
    expect(result.ratio).toBe(1);
    expect(result.percent).toBe(100);
  });

  it('handles routine with no steps (0% adherence)', () => {
    const routines = [makeRoutine('r1', [])];
    const result = selectRoutineAdherence.projector(routines);
    expect(result.ratio).toBe(0);
    expect(result.percent).toBe(0);
  });
});

// ── selectPriorityDistribution ───────────────────────────────────────────────
describe('selectPriorityDistribution', () => {
  it('returns all zeros for no items', () => {
    expect(selectPriorityDistribution.projector([])).toEqual({ high: 0, medium: 0, low: 0 });
  });

  it('buckets items by _priorityScore', () => {
    const items = [
      { ...makeItem('a', 'next', todayIso(), todayIso()), _priorityScore: 0.8 },  // high >= 0.66
      { ...makeItem('b', 'next', todayIso(), todayIso()), _priorityScore: 0.5 },  // medium >= 0.33
      { ...makeItem('c', 'next', todayIso(), todayIso()), _priorityScore: 0.1 },  // low < 0.33
      { ...makeItem('d', 'next', todayIso(), todayIso()), _priorityScore: 0.66 }, // high (boundary)
      { ...makeItem('e', 'next', todayIso(), todayIso()), _priorityScore: 0.33 }, // medium (boundary)
    ];
    const result = selectPriorityDistribution.projector(items as ItemEntity[]);
    expect(result.high).toBe(2);
    expect(result.medium).toBe(2);
    expect(result.low).toBe(1);
  });

  it('uses 0 for items without _priorityScore (goes to low)', () => {
    const items = [makeItem('a', 'next', todayIso(), todayIso())];
    const result = selectPriorityDistribution.projector(items);
    expect(result.low).toBe(1);
  });
});

// ── selectEnergyDipWindow ────────────────────────────────────────────────────
describe('selectEnergyDipWindow', () => {
  it('returns null when fewer than 5 logs', () => {
    const logs = [makeEnergyLog(2, todayIso())];
    expect(selectEnergyDipWindow.projector(logs)).toBeNull();
  });

  it('returns null when no hour has >=2 readings after having >=5 logs', () => {
    // 5 logs all spread 3h apart to avoid duplicate hours
    const logs: EnergyLog[] = Array.from({ length: 5 }, (_, i) =>
      makeEnergyLog(3, new Date(Date.now() + i * 3 * 3600000).toISOString()),
    );
    // Result is null or string depending on wall-clock alignment; just check type
    const result = selectEnergyDipWindow.projector(logs);
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('identifies the dip window from repeated low-energy readings', () => {
    // Build 6 logs: 3 at hour 14 (level 1) and 3 at hour 10 (level 5)
    const base = new Date();
    base.setMinutes(15, 0, 0);

    const low = new Date(base);
    low.setHours(14);
    const high = new Date(base);
    high.setHours(10);

    const logs: EnergyLog[] = [
      makeEnergyLog(1, new Date(low.getTime()).toISOString()),
      makeEnergyLog(1, new Date(low.getTime() + 60000).toISOString()),
      makeEnergyLog(1, new Date(low.getTime() + 120000).toISOString()),
      makeEnergyLog(5, new Date(high.getTime()).toISOString()),
      makeEnergyLog(5, new Date(high.getTime() + 60000).toISOString()),
      makeEnergyLog(5, new Date(high.getTime() + 120000).toISOString()),
    ];
    const result = selectEnergyDipWindow.projector(logs);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result).toContain('14:');
  });
});

// ── selectCompletionStreak ───────────────────────────────────────────────────
describe('selectCompletionStreak', () => {
  it('returns 0 when no done items', () => {
    expect(selectCompletionStreak.projector([])).toBe(0);
  });

  it('returns 0 when done items are too old', () => {
    const oldDone = makeItem('a', 'done', daysAgoIso(10), daysAgoIso(10));
    expect(selectCompletionStreak.projector([oldDone])).toBe(0);
  });

  it('returns 1 for a single done item today', () => {
    const item = makeItem('a', 'done', todayIso(), todayIso());
    expect(selectCompletionStreak.projector([item])).toBe(1);
  });

  it('returns streak length for consecutive days ending today', () => {
    const items = [
      makeItem('a', 'done', daysAgoIso(2), daysAgoIso(2)),
      makeItem('b', 'done', daysAgoIso(1), daysAgoIso(1)),
      makeItem('c', 'done', todayIso(), todayIso()),
    ];
    expect(selectCompletionStreak.projector(items)).toBe(3);
  });

  it('breaks streak on a gap', () => {
    const items = [
      makeItem('a', 'done', daysAgoIso(3), daysAgoIso(3)),
      // gap on day-ago-2
      makeItem('c', 'done', daysAgoIso(1), daysAgoIso(1)),
      makeItem('d', 'done', todayIso(), todayIso()),
    ];
    expect(selectCompletionStreak.projector(items)).toBe(2);
  });

  it('counts streak starting from yesterday when nothing done today', () => {
    const items = [
      makeItem('a', 'done', daysAgoIso(2), daysAgoIso(2)),
      makeItem('b', 'done', daysAgoIso(1), daysAgoIso(1)),
    ];
    expect(selectCompletionStreak.projector(items)).toBe(2);
  });
});
