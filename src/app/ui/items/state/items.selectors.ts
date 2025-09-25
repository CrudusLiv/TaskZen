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

// Priority scoring v2
// Factors:
//  - status weight (context readiness)
//  - freshness (recently updated) with decay
//  - age decay (very old items fade unless progress)
//  - energy alignment (penalize if item energy requirement far from latest logged energy)
//  - effort activation curve (prefer mid-low for quick wins unless boosted)
//  - focusBoost flag (explicit manual encouragement)
//  - due urgency placeholder (not yet implemented)
function scoreItem(it: any, now: number, latestEnergy?: number): number {
  const statusWeights: Record<string, number> = { inbox: 0.15, next: 1, progress: 0.95, done: 0 };
  const statusFocus = statusWeights[it.status] ?? 0;

  // Freshness based on updatedAt within 72h window
  let freshness = 0;
  if (it.updatedAt) {
    const ageH = (now - Date.parse(it.updatedAt)) / 36e5;
    freshness = ageH < 72 ? 1 - ageH / 72 : 0;
  }

  // Age decay (createdAt) after 14 days if untouched
  let ageDecay = 1;
  if (it.createdAt) {
    const ageDays = (now - Date.parse(it.createdAt)) / 86400000;
    if (ageDays > 14) {
      // logistic-ish fade
      ageDecay = 1 / (1 + (ageDays - 14) / 14);
    }
  }

  // Energy alignment penalty if difference >1 level
  let energyAlign = 0.6; // base if no data
  if (it.energyLevel && latestEnergy) {
    const diff = Math.abs(it.energyLevel - latestEnergy);
    energyAlign = diff === 0 ? 1 : diff === 1 ? 0.85 : diff === 2 ? 0.55 : 0.35;
  } else if (it.energyLevel) {
    energyAlign = 0.75; // have tagged energy but no current reading
  }

  // Effort curve (prefer 2-3). Higher effort gets modest penalty unless focusBoost
  const effortScore = it.effort
    ? it.effort === 3
      ? 1
      : it.effort === 2
      ? 0.95
      : it.effort === 1
      ? 0.7
      : it.effort === 4
      ? 0.55
      : 0.45
    : 0.55;

  const focusBoost = it.focusBoost ? 1 : 0;

  const base =
    statusFocus * 0.33 +
    freshness * 0.15 +
    energyAlign * 0.14 +
    effortScore * 0.12 +
    focusBoost * 0.18;

  // Apply age decay multiplicatively
  return base * ageDecay;
}

// NOTE: Latest energy isn't directly imported here to avoid circular; caller can enhance later.
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
