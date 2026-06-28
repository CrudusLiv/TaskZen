import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { routinesFeatureKey, RoutineEntity } from './routines.actions';
import { RoutinesState } from './routines.reducer';

export const selectRoutinesFeature = createFeatureSelector<RoutinesState>(routinesFeatureKey);
export const selectRoutineEntities = createSelector(selectRoutinesFeature, (s) => s.entities);
export const selectRoutineOrder = createSelector(selectRoutinesFeature, (s) => s.order);
export const selectRoutinesArray = createSelector(
  selectRoutineEntities,
  selectRoutineOrder,
  (entities, order) => order.map((id) => entities[id]).filter(Boolean)
);

const _selectRoutineByIdCache = new Map<string, MemoizedSelector<any, RoutineEntity | null>>();

export const selectRoutineById = (id: string): MemoizedSelector<any, RoutineEntity | null> => {
  if (!_selectRoutineByIdCache.has(id)) {
    _selectRoutineByIdCache.set(id, createSelector(
      selectRoutineEntities,
      (entities): RoutineEntity | null => entities[id] ?? null
    ) as MemoizedSelector<any, RoutineEntity | null>);
  }
  return _selectRoutineByIdCache.get(id)!;
};
