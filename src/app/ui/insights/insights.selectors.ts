import { createSelector } from '@ngrx/store';
import { selectItemsArray } from '../items/state/items.selectors';
import { selectEnergyLogs } from '../energy/state/energy.selectors';
import { selectRoutinesArray } from '../routines/state/routines.selectors';
import { selectCurrentFocus } from '../focus/state/focus.selectors';

// Focus time metrics (placeholder until history implemented)
export const selectFocusActiveMinutesToday = createSelector(selectCurrentFocus, (cur) => {
  if (!cur || !cur.startedAt) return 0;
  const start = new Date(cur.startedAt);
  const now = Date.now();
  const sameDay = start.toDateString() === new Date().toDateString();
  if (!sameDay) return 0;
  return Math.floor((cur.tickSeconds || 0) / 60);
});

// Items captured vs completed today
export const selectItemsCapturedToday = createSelector(selectItemsArray, (items) => {
  const today = new Date().toDateString();
  return items.filter((i) => new Date(i.createdAt).toDateString() === today).length;
});
export const selectItemsCompletedToday = createSelector(selectItemsArray, (items) => {
  const today = new Date().toDateString();
  return items.filter((i) => i.status === 'done' && new Date(i.updatedAt).toDateString() === today)
    .length;
});

// Energy trend last 7 logs newest->oldest levels reversed for chart chronological
export const selectEnergyTrend = createSelector(selectEnergyLogs, (logs) => {
  const slice = logs.slice(0, 7).map((l) => ({ level: l.level, createdAt: l.createdAt }));
  return [...slice].reverse();
});

// Routine adherence (placeholder: ratio of routines having >=1 step to total) later will use completion logs
export const selectRoutineAdherence = createSelector(selectRoutinesArray, (routines) => {
  if (!routines.length) return { ratio: 0, percent: 0 };
  const withSteps = routines.filter((r) => (r.steps?.length || 0) > 0).length;
  const ratio = withSteps / routines.length;
  return { ratio, percent: Math.round(ratio * 100) };
});

// Item priority distribution (based on existing _priorityScore ephemeral calculation)
export const selectPriorityDistribution = createSelector(selectItemsArray, (items) => {
  const buckets = { high: 0, medium: 0, low: 0 };
  items.forEach((i: any) => {
    const score = i._priorityScore ?? 0; // if already computed by a parent selection chain
    if (score >= 0.66) buckets.high++;
    else if (score >= 0.33) buckets.medium++;
    else buckets.low++;
  });
  return buckets;
});
