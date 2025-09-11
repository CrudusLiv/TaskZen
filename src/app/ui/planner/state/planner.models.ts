export interface PlannerState { dailyFocusIds: string[]; loaded: boolean; }
export const plannerFeatureKey = 'planner';
export const initialPlannerState: PlannerState = { dailyFocusIds: [], loaded: false };
