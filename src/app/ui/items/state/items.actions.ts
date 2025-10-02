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
  contextNote?: string; // brief context / why
  microSteps?: string[]; // parsed micro steps
  microStepsState?: boolean[]; // parallel state (done flags) matching microSteps length
  routineId?: string; // link to routine template
  tags?: string[]; // lightweight categorization
  pinned?: boolean; // surfaced item for ADHD focus anchoring
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
      tags?: string[];
      microSteps?: string[];
      pinned?: boolean;
    }>(),
    'Add Many': props<{
      items: Array<{
        title: string;
        description?: string;
        estimateMinutes?: number;
        energyLevel?: 1 | 2 | 3 | 4 | 5;
        effort?: 1 | 2 | 3 | 4 | 5;
        due?: string;
        focusBoost?: boolean;
        tags?: string[];
        microSteps?: string[];
        pinned?: boolean;
      }>;
    }>(),
    'Update Item': props<{ id: string; changes: Partial<Omit<ItemEntity, 'id' | 'createdAt'>> }>(),
    'Patch Item': props<{ id: string; changes: Partial<Omit<ItemEntity, 'id' | 'createdAt' | 'updatedAt'>> }>(),
    'Patch Many': props<{ updates: Array<{ id: string; changes: Partial<Omit<ItemEntity, 'id' | 'createdAt' | 'updatedAt'>> }> }>(),
  'Toggle Micro Step': props<{ id: string; index: number }>(),
  'Toggle Pin': props<{ id: string }>(),
    'Delete Item': props<{ id: string }>(),
    'Move Status': props<{ id: string; status: ItemEntity['status'] }>(),
    'Replace All': props<{ items: ItemEntity[] }>(),
    Hydrate: props<{ items: ItemEntity[] }>(),
    'Load Demo': emptyProps(),
  },
});
