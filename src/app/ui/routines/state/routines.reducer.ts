import { createReducer, on } from '@ngrx/store';
import {
  RoutinesActions,
  RoutineEntity,
  RoutineStep,
  routinesFeatureKey,
} from './routines.actions';

export interface RoutinesState {
  entities: Record<string, RoutineEntity>;
  order: string[]; // newest first
}

const initial: RoutinesState = { entities: {}, order: [] };

function sample(): RoutinesState {
  const now = new Date().toISOString();
  const r: RoutineEntity = {
    id: 'r1',
    name: 'Morning Activation',
    energyTarget: 3,
    cue: 'after waking',
    steps: [
      { id: 's1', title: 'Water + stretch', minutes: 2 },
      { id: 's2', title: 'Journal 3 lines', minutes: 5 },
      { id: 's3', title: 'Plan top 3', minutes: 4 },
    ],
    createdAt: now,
    updatedAt: now,
  };
  return { entities: { [r.id]: r }, order: [r.id] };
}

export const routinesReducer = createReducer(
  initial,
  on(RoutinesActions.loadSample, () => sample()),
  on(RoutinesActions.hydrate, (s, { routines }) => {
    const entities: Record<string, RoutineEntity> = {};
    const order: string[] = [];
    routines.forEach((r) => {
      entities[r.id] = r;
      order.unshift(r.id);
    });
    return { entities, order };
  }),
  on(RoutinesActions.addRoutine, (s, { name, energyTarget, cue }) => {
    const id = 'r' + Date.now();
    const now = new Date().toISOString();
    const ent: RoutineEntity = {
      id,
      name,
      energyTarget,
      cue,
      steps: [],
      createdAt: now,
      updatedAt: now,
    };
    return { entities: { ...s.entities, [id]: ent }, order: [id, ...s.order] };
  }),
  on(RoutinesActions.updateRoutineMeta, (s, { id, changes }) => {
    const cur = s.entities[id];
    if (!cur) return s;
    const updated: RoutineEntity = { ...cur, ...changes, updatedAt: new Date().toISOString() };
    return { ...s, entities: { ...s.entities, [id]: updated } };
  }),
  on(RoutinesActions.deleteRoutine, (s, { id }) => {
    if (!s.entities[id]) return s;
    const entities = Object.fromEntries(
      Object.entries(s.entities).filter(([k]) => k !== id),
    ) as Record<string, RoutineEntity>;
    return { entities, order: s.order.filter((o) => o !== id) };
  }),
  on(RoutinesActions.addStep, (s, { routineId, title, minutes }) => {
    const cur = s.entities[routineId];
    if (!cur) return s;
    const step: RoutineStep = {
      id: 'st' + Date.now() + Math.random().toString(16).slice(2),
      title,
      minutes,
    };
    const updated: RoutineEntity = {
      ...cur,
      steps: [...cur.steps, step],
      updatedAt: new Date().toISOString(),
    };
    return { ...s, entities: { ...s.entities, [routineId]: updated } };
  }),
  on(RoutinesActions.updateStep, (s, { routineId, stepId, title, minutes }) => {
    const cur = s.entities[routineId];
    if (!cur) return s;
    const steps = cur.steps.map((st) =>
      st.id === stepId ? { ...st, title: title ?? st.title, minutes: minutes ?? st.minutes } : st,
    );
    const updated: RoutineEntity = { ...cur, steps, updatedAt: new Date().toISOString() };
    return { ...s, entities: { ...s.entities, [routineId]: updated } };
  }),
  on(RoutinesActions.removeStep, (s, { routineId, stepId }) => {
    const cur = s.entities[routineId];
    if (!cur) return s;
    const steps = cur.steps.filter((st) => st.id !== stepId);
    const updated: RoutineEntity = { ...cur, steps, updatedAt: new Date().toISOString() };
    return { ...s, entities: { ...s.entities, [routineId]: updated } };
  }),
  on(RoutinesActions.reorderStep, (s, { routineId, stepId, direction }) => {
    const cur = s.entities[routineId];
    if (!cur) return s;
    const idx = cur.steps.findIndex((st) => st.id === stepId);
    if (idx === -1) return s;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= cur.steps.length) return s;
    const steps = [...cur.steps];
    const [moved] = steps.splice(idx, 1);
    steps.splice(target, 0, moved);
    const updated: RoutineEntity = { ...cur, steps, updatedAt: new Date().toISOString() };
    return { ...s, entities: { ...s.entities, [routineId]: updated } };
  }),
);

export { routinesFeatureKey };
