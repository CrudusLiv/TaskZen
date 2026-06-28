import { createFeatureSelector, createSelector } from '@ngrx/store';
import { focusFeatureKey, FocusSessionState } from './focus.reducer';

export const selectFocusFeature = createFeatureSelector<FocusSessionState>(focusFeatureKey);

export const selectCurrentFocus = createSelector(selectFocusFeature, (f) => f.current);
export const selectFocusHistory = createSelector(selectFocusFeature, (f) => f.history);
export const selectFocusDayStreak = createSelector(selectFocusFeature, (f) => f.dayStreak);

export const selectFocusMinutesToday = createSelector(selectFocusFeature, (f) => {
  const today = new Date().toDateString();
  let total = 0;
  f.history.forEach((sess) => {
    if (sess.completed && sess.endedAt && new Date(sess.endedAt).toDateString() === today) {
      total += sess.actualMinutes || 0;
    }
  });
  if (f.current && new Date(f.current.startedAt).toDateString() === today) {
    total += Math.floor((f.current.tickSeconds || 0) / 60);
  }
  return total;
});

export const selectOnBreak = createSelector(selectCurrentFocus, (cur) => cur?.status === 'break');

export const selectSessionExpired = createSelector(selectCurrentFocus, (cur) => {
  if (!cur || cur.status === 'break') return false;
  return cur.tickSeconds >= cur.plannedMinutes * 60;
});

export const selectHyperfocusWarning = createSelector(selectCurrentFocus, (cur) => {
  if (!cur || cur.status === 'break') return false;
  return cur.tickSeconds >= (cur.plannedMinutes + 15) * 60;
});
