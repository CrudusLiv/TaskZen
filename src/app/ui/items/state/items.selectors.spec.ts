import { selectAllTags } from './items.selectors';
import { ItemsState } from './items.reducer';

describe('selectAllTags', () => {
  it('returns empty array when no items', () => {
    const state: ItemsState = { entities: {}, order: [] };
    // projector receives items array created by preceding selector
    const result = selectAllTags.projector([]);
    expect(result).toEqual([]);
  });

  it('aggregates unique, lowercased & sorted tags', () => {
    const now = new Date().toISOString();
    // simulate items array (bypassing full state selectors chain)
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
    ] as any;
    // selectAllTags uses selectItemsArray as its input; we can directly call projector
    const result = selectAllTags.projector(items);
    expect(result).toEqual(['focus', 'health', 'misc', 'work']);
  });
});
