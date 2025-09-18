import { createActionGroup, props, emptyProps } from '@ngrx/store';

export interface ItemEntity {
  id: string;
  title: string;
  description?: string;
  estimateMinutes?: number;
  actualMinutes?: number;
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  effort?: 1 | 2 | 3 | 4 | 5;
  rewardNote?: string;
  focusBoost?: boolean;
  status: 'inbox' | 'next' | 'progress' | 'done';
  createdAt: string;
  updatedAt: string;
  due?: string;
}

export const itemsFeatureKey = 'items';

export const ItemsActions = createActionGroup({
  source: 'Items',
  events: {
    Init: emptyProps(),
    'Add Item': props<{
      title: string;
      description?: string;
      estimateMinutes?: number;
      energyLevel?: 1 | 2 | 3 | 4 | 5;
      effort?: 1 | 2 | 3 | 4 | 5;
      due?: string;
      focusBoost?: boolean;
    }>(),
    'Update Item': props<{ id: string; changes: Partial<Omit<ItemEntity, 'id' | 'createdAt'>> }>(),
    'Delete Item': props<{ id: string }>(),
    'Move Status': props<{ id: string; status: ItemEntity['status'] }>(),
    'Replace All': props<{ items: ItemEntity[] }>(),
    'Load Demo': emptyProps(),
  },
});
