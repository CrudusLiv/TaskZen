import { createFeatureSelector, createSelector } from '@ngrx/store';
import { itemsFeatureKey, ItemsState } from './items.reducer';

export const selectItemsFeature = createFeatureSelector<ItemsState>(itemsFeatureKey);
export const selectItemsEntities = createSelector(selectItemsFeature, (s) => s.entities);
export const selectItemsOrder = createSelector(selectItemsFeature, (s) => s.order);
export const selectItemsArray = createSelector(
  selectItemsEntities,
  selectItemsOrder,
  (entities, order) => order.map((id) => entities[id]).filter(Boolean)
);

// Priority scoring (lightweight initial heuristic)
// Factors (0..1 scaled) with weights: statusFocus, recency, energyFitPresence, effort, focusBoost
// Will evolve to include due urgency, streaks, energy match once those slices exist.
function scoreItem(it: any, now: number): number {
  // Status weight: inbox(0.2) next(1) progress(0.9) done(0)
  const statusWeights: Record<string, number> = { inbox: 0.2, next: 1, progress: 0.9, done: 0 };
  const statusFocus = statusWeights[it.status] ?? 0;

  // Recency: newer updatedAt -> slight boost (decay after 48h)
  let recency = 0;
  if (it.updatedAt) {
    const ageHours = (now - Date.parse(it.updatedAt)) / 36e5;
    recency = ageHours < 48 ? 1 - ageHours / 48 : 0;
  }

  // Energy fit presence: if energyLevel set give modest boost so curated tasks surface
  const energyFitPresence = it.energyLevel ? 0.6 : 0;

  // Effort: prefer low/moderate effort for activation: inverse curve mapping 1..5 => boost peaked at 2-3
  const effort = it.effort
    ? it.effort === 3
      ? 1
      : it.effort === 2
      ? 0.9
      : it.effort === 4
      ? 0.6
      : it.effort === 1
      ? 0.7
      : 0.3
    : 0.5;

  // Focus boost flag
  const focusBoost = it.focusBoost ? 1 : 0;

  // Weighted sum
  return (
    statusFocus * 0.35 + recency * 0.2 + energyFitPresence * 0.1 + effort * 0.15 + focusBoost * 0.2
  );
}

export const selectItemsWithPriority = createSelector(selectItemsArray, (items) => {
  const now = Date.now();
  return items
    .filter((i) => i.status !== 'done')
    .map((i) => ({ ...i, _priorityScore: scoreItem(i, now) }))
    .sort((a, b) => b._priorityScore - a._priorityScore);
});

export const selectTopThreeItems = createSelector(selectItemsWithPriority, (items) =>
  items.slice(0, 3)
);
