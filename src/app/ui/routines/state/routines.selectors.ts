import { createFeatureSelector, createSelector } from '@ngrx/store';
import { routinesFeatureKey } from './routines.actions';
import { RoutinesState } from './routines.reducer';

export const selectRoutinesFeature = createFeatureSelector<RoutinesState>(routinesFeatureKey);
export const selectRoutineEntities = createSelector(selectRoutinesFeature, (s) => s.entities);
export const selectRoutineOrder = createSelector(selectRoutinesFeature, (s) => s.order);
export const selectRoutinesArray = createSelector(
  selectRoutineEntities,
  selectRoutineOrder,
  (entities, order) => order.map((id) => entities[id]).filter(Boolean)
);
