import { createReducer, on } from '@ngrx/store';
import { FocusActions, focusFeatureKey, FocusSessionStateEntity } from './focus.actions';

export interface FocusSessionState {
  current?: FocusSessionStateEntity;
}

const initial: FocusSessionState = {};

function newId() {
  return 'focus_' + Date.now();
}

export const focusReducer = createReducer(
  initial,
  on(FocusActions.startSession, (s, { itemId, plannedMinutes, calmSnapshot }) => ({
    current: {
      id: newId(),
      itemId,
      plannedMinutes,
      startedAt: new Date().toISOString(),
      tickSeconds: 0,
      status: 'running',
      calmSnapshot,
    },
  })),
  on(FocusActions.tick, (s) => {
    if (!s.current || s.current.status !== 'running') return s;
    return { current: { ...s.current, tickSeconds: s.current.tickSeconds + 1 } };
  }),
  on(FocusActions.pause, (s) => {
    if (!s.current || s.current.status !== 'running') return s;
    return { current: { ...s.current, status: 'paused' } };
  }),
  on(FocusActions.resume, (s) => {
    if (!s.current || s.current.status !== 'paused') return s;
    return { current: { ...s.current, status: 'running' } };
  }),
  on(FocusActions.stop, (s) => {
    if (!s.current) return s;
    return { current: undefined };
  }),
  on(FocusActions.abort, (s) => ({ current: undefined }))
);

export { focusFeatureKey };
