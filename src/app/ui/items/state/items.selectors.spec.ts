import {
  selectAllTags,
  selectItemsWithPriority,
  selectTopThreeItems,
  selectStuckTasks,
} from './items.selectors';
import { ItemEntity } from './items.actions';

function makeItem(overrides: Partial<ItemEntity> & { id: string; title: string }): ItemEntity {
  const now = new Date().toISOString();
  return {
    status: 'inbox',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as ItemEntity;
}

describe('selectAllTags', () => {
  it('returns empty array when no items', () => {
    const result = selectAllTags.projector([]);
    expect(result).toEqual([]);
  });

  it('aggregates unique, lowercased & sorted tags', () => {
    const now = new Date().toISOString();
    const items = [
      {
        id: 'a',
        title: 'One',
        status: 'inbox',
        createdAt: now,
        updatedAt: now,
        tags: ['Work', 'Focus'],
      },
      {
        id: 'b',
        title: 'Two',
        status: 'inbox',
        createdAt: now,
        updatedAt: now,
        tags: ['focus', 'Health'],
      },
      { id: 'c', title: 'Three', status: 'inbox', createdAt: now, updatedAt: now },
      { id: 'd', title: 'Four', status: 'inbox', createdAt: now, updatedAt: now, tags: ['misc'] },
    ] as ItemEntity[];
    const result = selectAllTags.projector(items);
    expect(result).toEqual(['focus', 'health', 'misc', 'work']);
  });

  it('returns empty array when items have no tags', () => {
    const items = [makeItem({ id: 'x', title: 'No tags' })];
    expect(selectAllTags.projector(items)).toEqual([]);
  });
});

describe('selectItemsWithPriority', () => {
  it('returns empty array for no items', () => {
    expect(selectItemsWithPriority.projector([])).toEqual([]);
  });

  it('excludes done items', () => {
    const items = [
      makeItem({ id: 'a', title: 'Active', status: 'next' }),
      makeItem({ id: 'b', title: 'Done', status: 'done' }),
    ];
    const result = selectItemsWithPriority.projector(items);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('a');
  });

  it('attaches _priorityScore to each item', () => {
    const items = [makeItem({ id: 'a', title: 'Task', status: 'next' })];
    const result = selectItemsWithPriority.projector(items);
    expect(result[0]._priorityScore).toBeDefined();
    expect(typeof result[0]._priorityScore).toBe('number');
  });

  it('sorts by priority score descending', () => {
    const now = new Date().toISOString();
    // focusBoost=true should push score higher; status=progress ranks higher than inbox
    const items = [
      makeItem({ id: 'low', title: 'Low', status: 'inbox', focusBoost: false }),
      makeItem({ id: 'high', title: 'High', status: 'next', focusBoost: true }),
    ];
    const result = selectItemsWithPriority.projector(items);
    expect(result[0]._priorityScore).toBeGreaterThanOrEqual(result[1]._priorityScore);
  });

  it('scores items with various effort levels', () => {
    // Cover effort branches: 1, 2, 3, 4, 5 (>=5 -> else branch 0.45)
    const items = [1, 2, 3, 4, 5].map((effort) =>
      makeItem({ id: `e${effort}`, title: `Effort ${effort}`, status: 'next', effort: effort as 1 | 2 | 3 | 4 | 5 }),
    );
    const result = selectItemsWithPriority.projector(items);
    expect(result.length).toBe(5);
  });

  it('scores items with energy alignment — various diff branches', () => {
    // scoreItem energy alignment: diff 0 -> 1.0, diff 1 -> 0.85, diff 2 -> 0.55, diff >=3 -> 0.35
    // We pass items through projector; we can't inject latestEnergy directly (no context),
    // but we can cover the "has energyLevel, no current reading" branch (energyAlign = 0.75)
    const items = [
      makeItem({ id: 'e1', title: 'With energy', status: 'next', energyLevel: 3 }),
      makeItem({ id: 'e2', title: 'No energy', status: 'next' }),
    ];
    const result = selectItemsWithPriority.projector(items);
    expect(result.length).toBe(2);
    // item with energyLevel should still get a valid score
    expect(result.find(i => i.id === 'e1')?._priorityScore).toBeGreaterThan(0);
  });

  it('applies age decay for old items (created >14 days ago)', () => {
    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const newDate = new Date().toISOString();
    const items = [
      makeItem({ id: 'old', title: 'Old', status: 'next', createdAt: oldDate, updatedAt: oldDate }),
      makeItem({ id: 'new', title: 'New', status: 'next', createdAt: newDate, updatedAt: newDate }),
    ];
    const result = selectItemsWithPriority.projector(items);
    // new item should have higher score due to freshness, old gets age decay
    expect(result.find((i) => i.id === 'old')?._priorityScore).toBeLessThan(
      result.find((i) => i.id === 'new')?._priorityScore ?? 0,
    );
  });

  it('handles items with no updatedAt freshness (staleness = 0)', () => {
    const item = makeItem({ id: 'a', title: 'Stale', status: 'next' });
    // Set updatedAt very old (>72h)
    const old = new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString();
    (item as { updatedAt: string }).updatedAt = old;
    const result = selectItemsWithPriority.projector([item]);
    expect(result.length).toBe(1);
    expect(result[0]._priorityScore).toBeGreaterThanOrEqual(0);
  });
});

describe('selectTopThreeItems', () => {
  it('returns at most 3 items', () => {
    const items = [1, 2, 3, 4, 5].map((n) => ({
      ...makeItem({ id: `i${n}`, title: `Item ${n}`, status: 'next' as const }),
      _priorityScore: n / 5,
    }));
    const result = selectTopThreeItems.projector(items);
    expect(result.length).toBe(3);
  });

  it('returns all items when fewer than 3', () => {
    const items = [{ ...makeItem({ id: 'a', title: 'Only', status: 'next' }), _priorityScore: 0.5 }];
    const result = selectTopThreeItems.projector(items);
    expect(result.length).toBe(1);
  });

  it('returns empty array when no items', () => {
    expect(selectTopThreeItems.projector([])).toEqual([]);
  });
});

describe('selectStuckTasks', () => {
  it('returns empty array when no items', () => {
    expect(selectStuckTasks.projector([])).toEqual([]);
  });

  it('returns items stuck in progress for >3 days', () => {
    const oldDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const items = [
      makeItem({ id: 'stuck', title: 'Stuck', status: 'progress', updatedAt: oldDate }),
      makeItem({ id: 'fresh', title: 'Fresh', status: 'progress' }), // just updated
    ];
    const result = selectStuckTasks.projector(items);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('stuck');
  });

  it('does not include done or inbox items', () => {
    const oldDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const items = [
      makeItem({ id: 'done', title: 'Done', status: 'done', updatedAt: oldDate }),
      makeItem({ id: 'inbox', title: 'Inbox', status: 'inbox', updatedAt: oldDate }),
    ];
    expect(selectStuckTasks.projector(items)).toEqual([]);
  });
});
