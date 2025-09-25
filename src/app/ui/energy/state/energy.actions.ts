import { createActionGroup, props, emptyProps } from '@ngrx/store';

export interface EnergyLog {
  id: string;
  level: 1 | 2 | 3 | 4 | 5;
  moods: string[];
  note?: string;
  createdAt: string; // ISO timestamp
}

export const energyFeatureKey = 'energy';

export const EnergyActions = createActionGroup({
  source: 'Energy',
  events: {
    Init: emptyProps(),
    'Add Log': props<{ level: 1 | 2 | 3 | 4 | 5; moods: string[]; note?: string }>(),
    'Delete Log': props<{ id: string }>(),
    'Hydrate': props<{ logs: EnergyLog[] }>(),
    'Load Sample': emptyProps(),
  },
});
