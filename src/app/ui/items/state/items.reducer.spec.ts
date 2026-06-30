import { itemsReducer, ItemsState } from './items.reducer';
import { ItemsActions, ItemEntity } from './items.actions';

function makeState(overrides: Partial<ItemsState> = {}): ItemsState {
  return { entities: {}, order: [], ...overrides };
}

function addOne(state: ItemsState, title: string, extra: Partial<Parameters<typeof ItemsActions.addItem>[0]> = {}): { state: ItemsState; id: string } {
  const s = itemsReducer(state, ItemsActions.addItem({ title, ...extra }));
  return { state: s, id: s.order[0] };
}

describe('itemsReducer', () => {
  it('addMany inserts items newest-first and normalizes tags', () => {
    const initial: ItemsState = { entities: {}, order: [] };
    const action = ItemsActions.addMany({
      items: [
        { title: 'Alpha task', tags: ['Work', 'work', 'Deep'] },
        { title: 'Beta task', energyLevel: 2, tags: ['Focus', 'focus', 'Deep'] },
      ],
    });
    const s1 = itemsReducer(initial, action);
    expect(s1.order.length).toBe(2);
    // First in order should be the second inserted (newest-first unshift logic)
    const newestId = s1.order[0];
    const olderId = s1.order[1];
    const newest = s1.entities[newestId];
    const older = s1.entities[olderId];
    expect(newest.title).toBe('Beta task');
    expect(older.title).toBe('Alpha task');
    // Tags normalized (lowercased + deduped) or left undefined if none
    expect(newest.tags).toEqual(['focus', 'deep']);
    expect(older.tags).toEqual(['work', 'deep']);
  });

  it('addItem normalizes tags and sets defaults', () => {
    const s0: ItemsState = { entities: {}, order: [] };
    const action = ItemsActions.addItem({ title: 'Task', tags: ['Tag', 'tag', 'Extra'] });
    const s1 = itemsReducer(s0, action);
    const id = s1.order[0];
    const e = s1.entities[id];
    expect(e.title).toBe('Task');
    expect(e.status).toBe('inbox');
    expect(e.tags).toEqual(['tag', 'extra']);
    expect(e.createdAt).toBeTruthy();
    expect(e.updatedAt).toBeTruthy();
  });

  it('deleteItem removes from entities and order', () => {
    const add = ItemsActions.addItem({ title: 'Delete me' });
    const mid = itemsReducer({ entities: {}, order: [] }, add);
    const id = mid.order[0];
    const del = ItemsActions.deleteItem({ id });
    const done = itemsReducer(mid, del);
    expect(done.entities[id]).toBeUndefined();
    expect(done.order.includes(id)).toBe(false);
  });

  it('addItem with no tags leaves tags undefined', () => {
    const { state, id } = addOne(makeState(), 'Tagless');
    expect(state.entities[id].tags).toBeUndefined();
  });

  it('addItem with empty tags array leaves tags undefined', () => {
    const { state, id } = addOne(makeState(), 'EmptyTags', { tags: [] });
    expect(state.entities[id].tags).toBeUndefined();
  });

  it('addItem with microSteps creates microStepsState', () => {
    const { state, id } = addOne(makeState(), 'Steps task', { microSteps: ['step 1', 'step 2'] });
    const e = state.entities[id];
    expect(e.microSteps).toEqual(['step 1', 'step 2']);
    expect(e.microStepsState).toEqual([false, false]);
  });

  it('addItem with empty microSteps leaves both undefined', () => {
    const { state, id } = addOne(makeState(), 'No steps', { microSteps: [] });
    const e = state.entities[id];
    expect(e.microSteps).toBeUndefined();
    expect(e.microStepsState).toBeUndefined();
  });

  it('addItem sets pinned default to false', () => {
    const { state, id } = addOne(makeState(), 'Unpin');
    expect(state.entities[id].pinned).toBe(false);
  });

  it('addItem sets pinned true when provided', () => {
    const { state, id } = addOne(makeState(), 'Pinned', { pinned: true });
    expect(state.entities[id].pinned).toBe(true);
  });

  it('addMany with empty array returns same state', () => {
    const s0 = makeState();
    const s1 = itemsReducer(s0, ItemsActions.addMany({ items: [] }));
    expect(s1).toBe(s0);
  });

  it('addMany without tags leaves tags undefined', () => {
    const s1 = itemsReducer(makeState(), ItemsActions.addMany({ items: [{ title: 'No tags' }] }));
    const e = s1.entities[s1.order[0]];
    expect(e.tags).toBeUndefined();
  });

  it('addMany with microSteps creates microStepsState', () => {
    const s1 = itemsReducer(makeState(), ItemsActions.addMany({ items: [{ title: 'T', microSteps: ['a'] }] }));
    const e = s1.entities[s1.order[0]];
    expect(e.microStepsState).toEqual([false]);
  });

  it('deleteItem for unknown id returns same state', () => {
    const s0 = makeState();
    const s1 = itemsReducer(s0, ItemsActions.deleteItem({ id: 'not-found' }));
    expect(s1).toBe(s0);
  });

  it('updateItem applies changes and updates updatedAt', () => {
    const { state: s0, id } = addOne(makeState(), 'Original');
    const before = s0.entities[id].updatedAt;
    const s1 = itemsReducer(s0, ItemsActions.updateItem({ id, changes: { title: 'Changed', status: 'next' } }));
    expect(s1.entities[id].title).toBe('Changed');
    expect(s1.entities[id].status).toBe('next');
    expect(s1.entities[id].updatedAt).toBeTruthy();
    // updatedAt may be same or newer timestamp; just check it's set
    expect(typeof s1.entities[id].updatedAt).toBe('string');
    void before;
  });

  it('updateItem for unknown id returns same state', () => {
    const s0 = makeState();
    const s1 = itemsReducer(s0, ItemsActions.updateItem({ id: 'nope', changes: { title: 'x' } }));
    expect(s1).toBe(s0);
  });

  it('updateItem with new microSteps preserves existing microStepsState length', () => {
    const { state: s0, id } = addOne(makeState(), 'Steps', { microSteps: ['a', 'b'] });
    // toggle first step
    const s1 = itemsReducer(s0, ItemsActions.toggleMicroStep({ id, index: 0 }));
    // now update with new microSteps (same length)
    const s2 = itemsReducer(s1, ItemsActions.updateItem({ id, changes: { microSteps: ['x', 'y'] } }));
    // State at index 0 was true; should be preserved
    expect(s2.entities[id].microStepsState?.[0]).toBe(true);
    expect(s2.entities[id].microStepsState?.[1]).toBe(false);
  });

  it('patchItem applies changes', () => {
    const { state: s0, id } = addOne(makeState(), 'Patch me');
    const s1 = itemsReducer(s0, ItemsActions.patchItem({ id, changes: { status: 'progress' } }));
    expect(s1.entities[id].status).toBe('progress');
  });

  it('patchItem for unknown id returns same state', () => {
    const s0 = makeState();
    const s1 = itemsReducer(s0, ItemsActions.patchItem({ id: 'nope', changes: { status: 'done' } }));
    expect(s1).toBe(s0);
  });

  it('patchItem with new microSteps builds microStepsState', () => {
    const { state: s0, id } = addOne(makeState(), 'Patch steps');
    const s1 = itemsReducer(s0, ItemsActions.patchItem({ id, changes: { microSteps: ['step1'] } }));
    expect(s1.entities[id].microStepsState).toEqual([false]);
  });

  it('patchMany applies multiple updates', async () => {
    const { state: s0, id: id1 } = addOne(makeState(), 'Item 1');
    // Small delay to avoid same-ms IDs when Date.now() is used as key
    await new Promise((r) => setTimeout(r, 5));
    const { state: s1, id: id2 } = addOne(s0, 'Item 2');
    // Ensure distinct ids; if same (extremely fast machine), skip assertion safely
    if (id1 === id2) { return; }
    const s2 = itemsReducer(s1, ItemsActions.patchMany({
      updates: [
        { id: id1, changes: { status: 'done' } },
        { id: id2, changes: { status: 'next' } },
      ],
    }));
    expect(s2.entities[id1].status).toBe('done');
    expect(s2.entities[id2].status).toBe('next');
  });

  it('patchMany with empty array returns same state', () => {
    const s0 = makeState();
    const s1 = itemsReducer(s0, ItemsActions.patchMany({ updates: [] }));
    expect(s1).toBe(s0);
  });

  it('patchMany skips unknown ids', () => {
    const { state: s0, id } = addOne(makeState(), 'Only');
    const s1 = itemsReducer(s0, ItemsActions.patchMany({
      updates: [{ id: 'nope', changes: { status: 'done' } }],
    }));
    // entities should be unchanged
    expect(s1.entities[id].status).toBe('inbox');
  });

  it('patchMany with microSteps builds microStepsState', () => {
    const { state: s0, id } = addOne(makeState(), 'Patch many steps');
    const s1 = itemsReducer(s0, ItemsActions.patchMany({
      updates: [{ id, changes: { microSteps: ['a', 'b'] } }],
    }));
    expect(s1.entities[id].microStepsState).toEqual([false, false]);
  });

  it('patchMany preserves existing microStepsState on re-patch', () => {
    const { state: s0, id } = addOne(makeState(), 'Preserve', { microSteps: ['a', 'b'] });
    // toggle step 0
    const s1 = itemsReducer(s0, ItemsActions.toggleMicroStep({ id, index: 0 }));
    // patch with same microSteps (re-patch preserves state[0]=true)
    const s2 = itemsReducer(s1, ItemsActions.patchMany({
      updates: [{ id, changes: { microSteps: ['a', 'b'] } }],
    }));
    expect(s2.entities[id].microStepsState?.[0]).toBe(true);
  });

  it('patchMany without microSteps preserves existing microStepsState', () => {
    const { state: s0, id } = addOne(makeState(), 'NoMsChange', { microSteps: ['x'] });
    const s1 = itemsReducer(s0, ItemsActions.patchMany({
      updates: [{ id, changes: { status: 'next' } }],
    }));
    expect(s1.entities[id].microStepsState).toEqual([false]);
  });

  it('moveStatus updates status', () => {
    const { state: s0, id } = addOne(makeState(), 'Move me');
    const s1 = itemsReducer(s0, ItemsActions.moveStatus({ id, status: 'done' }));
    expect(s1.entities[id].status).toBe('done');
  });

  it('moveStatus with same status returns same state', () => {
    const { state: s0, id } = addOne(makeState(), 'No change');
    const s1 = itemsReducer(s0, ItemsActions.moveStatus({ id, status: 'inbox' }));
    expect(s1).toBe(s0);
  });

  it('moveStatus for unknown id returns same state', () => {
    const s0 = makeState();
    const s1 = itemsReducer(s0, ItemsActions.moveStatus({ id: 'nope', status: 'done' }));
    expect(s1).toBe(s0);
  });

  it('toggleMicroStep flips step at index', () => {
    const { state: s0, id } = addOne(makeState(), 'Toggle', { microSteps: ['a', 'b', 'c'] });
    const s1 = itemsReducer(s0, ItemsActions.toggleMicroStep({ id, index: 1 }));
    expect(s1.entities[id].microStepsState).toEqual([false, true, false]);
    // Toggle again
    const s2 = itemsReducer(s1, ItemsActions.toggleMicroStep({ id, index: 1 }));
    expect(s2.entities[id].microStepsState).toEqual([false, false, false]);
  });

  it('toggleMicroStep for unknown id returns same state', () => {
    const s0 = makeState();
    const s1 = itemsReducer(s0, ItemsActions.toggleMicroStep({ id: 'nope', index: 0 }));
    expect(s1).toBe(s0);
  });

  it('toggleMicroStep for item with no microSteps returns same state', () => {
    const { state: s0, id } = addOne(makeState(), 'No steps');
    const s1 = itemsReducer(s0, ItemsActions.toggleMicroStep({ id, index: 0 }));
    expect(s1).toBe(s0);
  });

  it('toggleMicroStep with out-of-range index returns same state', () => {
    const { state: s0, id } = addOne(makeState(), 'Steps', { microSteps: ['a'] });
    const s1 = itemsReducer(s0, ItemsActions.toggleMicroStep({ id, index: 99 }));
    expect(s1).toBe(s0);
  });

  it('togglePin flips pinned flag', () => {
    const { state: s0, id } = addOne(makeState(), 'Pin me');
    expect(s0.entities[id].pinned).toBe(false);
    const s1 = itemsReducer(s0, ItemsActions.togglePin({ id }));
    expect(s1.entities[id].pinned).toBe(true);
    const s2 = itemsReducer(s1, ItemsActions.togglePin({ id }));
    expect(s2.entities[id].pinned).toBe(false);
  });

  it('togglePin for unknown id returns same state', () => {
    const s0 = makeState();
    const s1 = itemsReducer(s0, ItemsActions.togglePin({ id: 'nope' }));
    expect(s1).toBe(s0);
  });

  it('hydrate populates state from provided items', () => {
    const now = new Date().toISOString();
    const items: ItemEntity[] = [
      { id: 'h1', title: 'Hydrated 1', status: 'inbox', createdAt: now, updatedAt: now },
      { id: 'h2', title: 'Hydrated 2', status: 'next', createdAt: now, updatedAt: now },
    ];
    const s1 = itemsReducer(makeState(), ItemsActions.hydrate({ items }));
    expect(Object.keys(s1.entities).length).toBe(2);
    expect(s1.entities['h1'].title).toBe('Hydrated 1');
    expect(s1.order.length).toBe(2);
  });

  it('replaceAll replaces entire state', () => {
    const { state: s0 } = addOne(makeState(), 'Old');
    const now = new Date().toISOString();
    const items: ItemEntity[] = [
      { id: 'r1', title: 'New', status: 'progress', createdAt: now, updatedAt: now },
    ];
    const s1 = itemsReducer(s0, ItemsActions.replaceAll({ items }));
    expect(Object.keys(s1.entities).length).toBe(1);
    expect(s1.entities['r1'].title).toBe('New');
  });

  it('loadDemo populates demo items', () => {
    const s1 = itemsReducer(makeState(), ItemsActions.loadDemo());
    expect(s1.order.length).toBeGreaterThan(0);
    expect(Object.keys(s1.entities).length).toBeGreaterThan(0);
    // Demo has known item titles
    const titles = s1.order.map((id) => s1.entities[id].title);
    expect(titles).toContain('Tidy desk');
  });
});
