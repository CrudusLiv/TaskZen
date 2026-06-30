import { createActionGroup, props } from '@ngrx/store';

export const AppActions = createActionGroup({
  source: 'App',
  events: {
    Error: props<{ message: string; source?: string; code?: string }>(),
    Info: props<{ message: string }>(),
    Success: props<{ message: string }>(),
  },
});
