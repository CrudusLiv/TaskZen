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
