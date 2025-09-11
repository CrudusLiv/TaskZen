import { createReducer, on } from '@ngrx/store';
import { FocusActions } from './focus.actions';

export const focusFeatureKey = 'focus';

export interface FocusState {
  active: boolean;
  duration: number; // minutes
  remaining: number; // seconds
  startedAt?: string;
  completedPomodoros: number;
}

const initialState: FocusState = {
  active: false,
  duration: 25,
  remaining: 25 * 60,
  completedPomodoros: 0
};

export const focusReducer = createReducer(
  initialState,
  on(FocusActions.start, (s, { duration }) => ({ ...s, active: true, duration, remaining: duration * 60, startedAt: new Date().toISOString() })),
  on(FocusActions.tick, (s, { remaining }) => ({ ...s, remaining })),
  on(FocusActions.complete, s => ({ ...s, active: false, remaining: 0, completedPomodoros: s.completedPomodoros + 1 })),
  on(FocusActions.cancel, s => ({ ...s, active: false }))
);
