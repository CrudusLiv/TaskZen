import { itemsReducer, ItemsState } from './items.reducer';
import { ItemsActions } from './items.actions';

function getState(after: Partial<ItemsState>): ItemsState {
  return { entities: {}, order: [], ...after } as ItemsState;
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
});
