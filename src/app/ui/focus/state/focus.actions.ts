import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface FocusSessionStateEntity {
  id: string;
  itemId?: string;
  plannedMinutes: number;
  startedAt: string;
  tickSeconds: number; // elapsed seconds (excluding breaks)
  status: 'running' | 'paused' | 'stopped' | 'break';
  calmSnapshot: boolean;
  breakSegments?: { start: string; end?: string }[];
  endedAt?: string;
  completed?: boolean;
  aborted?: boolean;
  actualMinutes?: number; // derived when ended
}

export const focusFeatureKey = 'focusSession';

export const FocusActions = createActionGroup({
  source: 'FocusSession',
  events: {
    Init: emptyProps(),
    'Start Session': props<{ itemId?: string; plannedMinutes: number; calmSnapshot: boolean }>(),
    Tick: emptyProps(),
    Pause: emptyProps(),
    Resume: emptyProps(),
    'Start Break': emptyProps(),
    'End Break': emptyProps(),
    Complete: emptyProps(),
    Stop: emptyProps(),
    Abort: emptyProps(),
    Hydrate: props<{
      current?: FocusSessionStateEntity;
      history?: FocusSessionStateEntity[];
      dayStreak?: number;
      lastSessionDate?: string;
    }>(),
  },
});
