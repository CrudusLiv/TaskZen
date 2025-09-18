import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface FocusSessionStateEntity {
  id: string;
  itemId?: string;
  plannedMinutes: number;
  startedAt: string;
  tickSeconds: number; // elapsed seconds
  status: 'running' | 'paused' | 'stopped';
  calmSnapshot: boolean;
}

export const focusFeatureKey = 'focusSession';

export const FocusActions = createActionGroup({
  source: 'FocusSession',
  events: {
    Init: emptyProps(),
    'Start Session': props<{ itemId?: string; plannedMinutes: number; calmSnapshot: boolean }>(),
    'Tick': emptyProps(),
    'Pause': emptyProps(),
    'Resume': emptyProps(),
    'Stop': emptyProps(),
    'Abort': emptyProps(),
  }
});
