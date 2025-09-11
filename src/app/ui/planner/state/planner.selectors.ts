import { createSelector } from '@ngrx/store';
import { AppState } from '../../../store/app.state';
import { plannerFeatureKey, PlannerState } from './planner.models';

export const selectPlannerState = (s: AppState) => (s as any)[plannerFeatureKey] as PlannerState;
export const selectDailyFocusIds = createSelector(selectPlannerState, s => s.dailyFocusIds);
