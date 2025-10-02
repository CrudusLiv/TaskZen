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
  const sample: Omit<ItemEntity, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: 'Brain dump session',
      description: 'List everything swirling',
      status: 'inbox',
      focusBoost: true,
    },
    {
      title: 'Tidy desk',
      status: 'next',
      effort: 1,
      energyLevel: 1,
      estimateMinutes: 5,
      focusBoost: true,
    },
    {
      title: 'Finish report section',
      status: 'progress',
      effort: 4,
      energyLevel: 4,
      estimateMinutes: 30,
    },
  ];
  sample.forEach((s, i) => {
    const id = 'i' + i;
    entities[id] = { id, ...s, createdAt: now(), updatedAt: now() };
    order.unshift(id);
  });
  return { entities, order };
}

export const itemsReducer = createReducer(
  initial,
  on(ItemsActions.loadDemo, () => demo()),
  on(ItemsActions.hydrate, (s, { items }) => {
    const entities: Record<string, ItemEntity> = {};
    const order: string[] = [];
    items.forEach((it) => {
      entities[it.id] = it;
      order.unshift(it.id);
    });
    return { entities, order };
  }),
  on(ItemsActions.replaceAll, (s, { items }) => {
    const entities: Record<string, ItemEntity> = {};
    const order: string[] = [];
    items.forEach((it) => {
      entities[it.id] = it;
      order.unshift(it.id);
    });
    return { entities, order };
  }),
  on(
    ItemsActions.addItem,
    (
      s,
      { title, description, estimateMinutes, energyLevel, effort, due, focusBoost, tags, microSteps, pinned }
    ) => {
      const id = 'i' + Date.now();
      const now = new Date().toISOString();
      const entity: ItemEntity = {
        id,
        title,
        description,
        estimateMinutes,
        energyLevel,
        effort,
        due,
        focusBoost,
        tags: tags && tags.length ? [...new Set(tags.map((t) => t.toLowerCase()))] : undefined,
        actualMinutes: 0,
        microSteps: microSteps && microSteps.length ? microSteps : undefined,
        microStepsState:
          microSteps && microSteps.length ? new Array(microSteps.length).fill(false) : undefined,
        pinned: pinned || false,
        status: 'inbox',
        createdAt: now,
        updatedAt: now,
      };
      return { entities: { ...s.entities, [id]: entity }, order: [id, ...s.order] };
    }
  ),
  on(ItemsActions.addMany, (s, { items }) => {
    if (!items.length) return s;
    const entities = { ...s.entities } as Record<string, ItemEntity>;
    const order = [...s.order];
    const nowIso = new Date().toISOString();
    items.forEach((it, idx) => {
      const id = 'i' + Date.now() + '_' + idx;
      entities[id] = {
        id,
        title: it.title,
        description: it.description,
        estimateMinutes: it.estimateMinutes,
        energyLevel: it.energyLevel,
        effort: it.effort,
        due: it.due,
        focusBoost: it.focusBoost,
        tags: it.tags && it.tags.length ? [...new Set(it.tags.map((t) => t.toLowerCase()))] : undefined,
        actualMinutes: 0,
        microSteps: it.microSteps && it.microSteps.length ? it.microSteps : undefined,
        microStepsState:
          it.microSteps && it.microSteps.length
            ? new Array(it.microSteps.length).fill(false)
            : undefined,
        pinned: it.pinned || false,
        status: 'inbox',
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      order.unshift(id);
    });
    return { entities, order };
  }),
  on(ItemsActions.updateItem, (s, { id, changes }) => {
    const current = s.entities[id];
    if (!current) return s;
    let updated: ItemEntity = { ...current, ...changes };
    if (changes.microSteps) {
      const steps = changes.microSteps;
      updated.microStepsState = steps
        ? steps.map((_, i) => current.microStepsState?.[i] || false)
        : undefined;
    }
    updated.updatedAt = new Date().toISOString();
    return { ...s, entities: { ...s.entities, [id]: updated } };
  }),
  on(ItemsActions.patchItem, (s, { id, changes }) => {
    const current = s.entities[id];
    if (!current) return s;
    let updated: ItemEntity = { ...current, ...changes };
    if (changes.microSteps) {
      const steps = changes.microSteps;
      updated.microStepsState = steps
        ? steps.map((_, i) => current.microStepsState?.[i] || false)
        : undefined;
    }
    updated.updatedAt = new Date().toISOString();
    return { ...s, entities: { ...s.entities, [id]: updated } };
  }),
  on(ItemsActions.patchMany, (s, { updates }) => {
    if (!updates.length) return s;
    const entities = { ...s.entities } as Record<string, ItemEntity>;
    const now = new Date().toISOString();
    updates.forEach(({ id, changes }) => {
      const current = entities[id];
      if (!current) return;
      let updated: ItemEntity = { ...current, ...changes };
      if (changes.microSteps) {
        const steps = changes.microSteps;
        updated.microStepsState = steps
          ? steps.map((_, i) => current.microStepsState?.[i] || false)
          : undefined;
      }
      updated.updatedAt = now;
      entities[id] = updated;
    });
    return { ...s, entities };
  }),
  on(ItemsActions.moveStatus, (s, { id, status }) => {
    const current = s.entities[id];
    if (!current || current.status === status) return s;
    const updated: ItemEntity = { ...current, status, updatedAt: new Date().toISOString() };
    return { ...s, entities: { ...s.entities, [id]: updated } };
  }),
  on(ItemsActions.toggleMicroStep, (s, { id, index }) => {
    const current = s.entities[id];
    if (!current || !current.microSteps || !current.microStepsState) return s;
    if (index < 0 || index >= current.microStepsState.length) return s;
    const nextState = [...current.microStepsState];
    nextState[index] = !nextState[index];
    const updated: ItemEntity = {
      ...current,
      microStepsState: nextState,
      updatedAt: new Date().toISOString(),
    };
    return { ...s, entities: { ...s.entities, [id]: updated } };
  }),
  on(ItemsActions.togglePin, (s, { id }) => {
    const current = s.entities[id];
    if (!current) return s;
    const updated: ItemEntity = {
      ...current,
      pinned: !current.pinned,
      updatedAt: new Date().toISOString(),
    };
    return { ...s, entities: { ...s.entities, [id]: updated } };
  }),
  on(ItemsActions.deleteItem, (s, { id }) => {
    if (!s.entities[id]) return s;
    const { [id]: _, ...rest } = s.entities;
    return { entities: rest, order: s.order.filter((o) => o !== id) };
  })
);

export { itemsFeatureKey };
