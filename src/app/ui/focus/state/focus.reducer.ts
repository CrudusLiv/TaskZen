import { createReducer, on } from '@ngrx/store';
import { FocusActions, focusFeatureKey, FocusSessionStateEntity } from './focus.actions';

export interface FocusSessionState {
  current?: FocusSessionStateEntity;
  history: FocusSessionStateEntity[]; // newest first
  dayStreak: number; // consecutive days with a completed session
  lastSessionDate?: string; // yyyy-mm-dd of last completed session
}

const initial: FocusSessionState = { history: [], dayStreak: 0 };

function newId() {
  return 'focus_' + Date.now();
}

function pushToHistory(
  state: FocusSessionState,
  session: FocusSessionStateEntity
): FocusSessionState {
  if (!session) return state;
  const ended = session.endedAt ? session : { ...session, endedAt: new Date().toISOString() };
  const actualMinutes = Math.floor((ended.tickSeconds || 0) / 60);
  const finalized: FocusSessionStateEntity = { ...ended, actualMinutes };
  const history = [finalized, ...state.history].slice(0, 300);

  // Streak update only if completed flag true
  let { dayStreak, lastSessionDate } = state;
  if (finalized.completed) {
    const today = new Date(finalized.endedAt || finalized.startedAt).toISOString().slice(0, 10);
    if (!lastSessionDate) {
      dayStreak = 1;
      lastSessionDate = today;
    } else if (lastSessionDate === today) {
      // same day, streak unchanged
    } else {
      const prev = new Date(lastSessionDate + 'T00:00:00Z');
      const cur = new Date(today + 'T00:00:00Z');
      const diffDays = (cur.getTime() - prev.getTime()) / 86400000;
      if (diffDays === 1) dayStreak += 1;
      else dayStreak = 1;
      lastSessionDate = today;
    }
  }
  return { ...state, history, dayStreak, lastSessionDate };
}

export const focusReducer = createReducer(
  initial,
  on(FocusActions.startSession, (s, { itemId, plannedMinutes, calmSnapshot }) => ({
    ...s,
    current: {
      id: newId(),
      itemId,
      plannedMinutes,
      startedAt: new Date().toISOString(),
      tickSeconds: 0,
      status: 'running',
      calmSnapshot,
      breakSegments: [],
    },
  })),
  on(FocusActions.tick, (s) => {
    if (!s.current || s.current.status !== 'running') return s;
    return { ...s, current: { ...s.current, tickSeconds: s.current.tickSeconds + 1 } };
  }),
  on(FocusActions.pause, (s) => {
    if (!s.current || (s.current.status !== 'running' && s.current.status !== 'break')) return s;
    // If currently on break, ending break implicitly when pausing overall
    let current = s.current;
    if (current.status === 'break' && current.breakSegments?.length) {
      const segs = [...current.breakSegments];
      const last = segs[segs.length - 1];
      if (last && !last.end) last.end = new Date().toISOString();
      current = { ...current, breakSegments: segs };
    }
    return { ...s, current: { ...current, status: 'paused' } };
  }),
  on(FocusActions.resume, (s) => {
    if (!s.current || s.current.status !== 'paused') return s;
    return { ...s, current: { ...s.current, status: 'running' } };
  }),
  on(FocusActions.startBreak, (s) => {
    if (!s.current || s.current.status !== 'running') return s;
    const segs = [...(s.current.breakSegments || [])];
    segs.push({ start: new Date().toISOString() });
    return { ...s, current: { ...s.current, status: 'break', breakSegments: segs } };
  }),
  on(FocusActions.endBreak, (s) => {
    if (!s.current || s.current.status !== 'break') return s;
    const segs = [...(s.current.breakSegments || [])];
    const last = segs[segs.length - 1];
    if (last && !last.end) last.end = new Date().toISOString();
    return { ...s, current: { ...s.current, status: 'running', breakSegments: segs } };
  }),
  on(FocusActions.complete, (s) => {
    if (!s.current) return s;
    const finished: FocusSessionStateEntity = {
      ...s.current,
      status: 'stopped',
      endedAt: new Date().toISOString(),
      completed: true,
    };
    return pushToHistory({ ...s, current: undefined }, finished);
  }),
  on(FocusActions.stop, (s) => {
    if (!s.current) return s;
    // Stop without marking completed or aborted -> just archive
    const finished: FocusSessionStateEntity = {
      ...s.current,
      status: 'stopped',
      endedAt: new Date().toISOString(),
    };
    return pushToHistory({ ...s, current: undefined }, finished);
  }),
  on(FocusActions.abort, (s) => {
    if (!s.current) return s;
    const aborted: FocusSessionStateEntity = {
      ...s.current,
      status: 'stopped',
      endedAt: new Date().toISOString(),
      aborted: true,
    };
    return pushToHistory({ ...s, current: undefined }, aborted);
  }),
  on(FocusActions.hydrate, (s, { current, history, dayStreak, lastSessionDate }) => ({
    ...s,
    current,
    history: history || s.history,
    dayStreak: dayStreak ?? s.dayStreak,
    lastSessionDate: lastSessionDate ?? s.lastSessionDate,
  }))
);

export { focusFeatureKey };
