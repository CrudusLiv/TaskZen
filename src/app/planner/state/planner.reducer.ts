import { createReducer, on, createFeature } from '@ngrx/store';
import { PlannerActions } from './planner.actions';
import { initialPlannerState, plannerFeatureKey } from './planner.models';

export const plannerReducer = createReducer(
  initialPlannerState,
  on(PlannerActions.addDailyFocus, (state, { cardId }) => ({
    ...state,
    dailyFocusIds: state.dailyFocusIds.includes(cardId) ? state.dailyFocusIds : [...state.dailyFocusIds, cardId]
  })),
  on(PlannerActions.removeDailyFocus, (state, { cardId }) => ({
    ...state,
    dailyFocusIds: state.dailyFocusIds.filter(id => id !== cardId)
  })),
  on(PlannerActions.clearDailyFocus, (state) => ({ ...state, dailyFocusIds: [] }))
  ,on(PlannerActions.loadDailyFocusSuccess, (state, { ids }) => ({ ...state, dailyFocusIds: ids, loaded: true }))
);

export const plannerFeature = createFeature({ name: plannerFeatureKey, reducer: plannerReducer });
