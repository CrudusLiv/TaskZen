import { createActionGroup, props, emptyProps } from '@ngrx/store';

export const FocusActions = createActionGroup({
  source: 'Focus',
  events: {
  'Start': props<{ duration: number }>(),
  'Tick': props<{ remaining: number }>(),
  'Complete': emptyProps(),
  'Cancel': emptyProps()
  }
});
