import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const PlannerActions = createActionGroup({
  source: 'Planner',
  events: {
    'Add Daily Focus': props<{ cardId: string }>(),
    'Remove Daily Focus': props<{ cardId: string }>(),
  'Clear Daily Focus': emptyProps(),
  'Load Daily Focus': emptyProps(),
  'Load Daily Focus Success': props<{ ids: string[] }>(),
  'Persist Daily Focus': emptyProps()
  }
});
