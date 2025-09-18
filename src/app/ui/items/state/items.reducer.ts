import { createReducer, on } from '@ngrx/store';
import { ItemsActions, ItemEntity, itemsFeatureKey } from './items.actions';

export interface ItemsState {
  entities: Record<string, ItemEntity>;
  order: string[]; // simple newest-first order for now
}

const initial: ItemsState = { entities: {}, order: [] };

function demo(): ItemsState {
  const now = () => new Date().toISOString();
  const entities: Record<string, ItemEntity> = {};
  const order: string[] = [];
  const sample: Omit<ItemEntity,'id'|'createdAt'|'updatedAt'>[] = [
    { title: 'Brain dump session', description: 'List everything swirling', status: 'inbox', focusBoost: true },
    { title: 'Tidy desk', status: 'next', effort: 1, energyLevel: 1, estimateMinutes: 5, focusBoost: true },
    { title: 'Finish report section', status: 'progress', effort: 4, energyLevel: 4, estimateMinutes: 30 },
  ];
  sample.forEach((s,i)=> { const id = 'i'+i; entities[id] = { id, ...s, createdAt: now(), updatedAt: now() }; order.unshift(id); });
  return { entities, order };
}

export const itemsReducer = createReducer(
  initial,
  on(ItemsActions.loadDemo, ()=> demo()),
  on(ItemsActions.replaceAll, (s,{ items })=> {
    const entities: Record<string, ItemEntity> = {}; const order: string[] = [];
    items.forEach(it=> { entities[it.id] = it; order.unshift(it.id); });
    return { entities, order };
  }),
  on(ItemsActions.addItem, (s,{ title, description, estimateMinutes, energyLevel, effort, due, focusBoost })=> {
    const id = 'i'+Date.now();
    const now = new Date().toISOString();
    const entity: ItemEntity = { id, title, description, estimateMinutes, energyLevel, effort, due, focusBoost, actualMinutes: 0, status: 'inbox', createdAt: now, updatedAt: now };
    return { entities: { ...s.entities, [id]: entity }, order: [id, ...s.order] };
  }),
  on(ItemsActions.updateItem, (s,{ id, changes })=> {
    const current = s.entities[id]; if(!current) return s;
    const updated: ItemEntity = { ...current, ...changes, updatedAt: new Date().toISOString() };
    return { ...s, entities: { ...s.entities, [id]: updated } };
  }),
  on(ItemsActions.moveStatus, (s,{ id, status })=> {
    const current = s.entities[id]; if(!current || current.status === status) return s;
    const updated: ItemEntity = { ...current, status, updatedAt: new Date().toISOString() };
    return { ...s, entities: { ...s.entities, [id]: updated } };
  }),
  on(ItemsActions.deleteItem, (s,{ id })=> {
    if(!s.entities[id]) return s;
    const { [id]:_, ...rest } = s.entities;
    return { entities: rest, order: s.order.filter(o=> o!==id) };
  })
);

export { itemsFeatureKey };
