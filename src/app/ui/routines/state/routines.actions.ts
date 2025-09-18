import { createActionGroup, props, emptyProps } from '@ngrx/store';

export interface RoutineStep {
  id: string;
  title: string;
  minutes?: number; // optional timer
}

export interface RoutineEntity {
  id: string;
  name: string;
  energyTarget?: 1 | 2 | 3 | 4 | 5;
  cue?: string; // simple cue text for now
  steps: RoutineStep[]; // ordered
  createdAt: string;
  updatedAt: string;
}

export const routinesFeatureKey = 'routines';

export const RoutinesActions = createActionGroup({
  source: 'Routines',
  events: {
    Init: emptyProps(),
    'Add Routine': props<{ name: string; energyTarget?: 1 | 2 | 3 | 4 | 5; cue?: string }>(),
    'Update Routine Meta': props<{
      id: string;
      changes: Partial<Pick<RoutineEntity, 'name' | 'energyTarget' | 'cue'>>;
    }>(),
    'Delete Routine': props<{ id: string }>(),
    'Add Step': props<{ routineId: string; title: string; minutes?: number }>(),
    'Update Step': props<{ routineId: string; stepId: string; title?: string; minutes?: number }>(),
    'Remove Step': props<{ routineId: string; stepId: string }>(),
    'Reorder Step': props<{ routineId: string; stepId: string; direction: 'up' | 'down' }>(),
    'Load Sample': emptyProps(),
  },
});
