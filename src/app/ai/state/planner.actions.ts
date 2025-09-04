import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AiSuggestion } from './planner.models';

export const PlannerActions = createActionGroup({
  source: 'Planner',
  events: {
    'Generate Suggestions': emptyProps(),
    'Generation Started': emptyProps(),
    'Generation Failed': props<{ error: string }>(),
    'Upsert Suggestions': props<{ suggestions: AiSuggestion[] }>(),
    'Clear Suggestions': emptyProps(),
    'Accept Suggestion': props<{ id: string }>(),
    'Reject Suggestion': props<{ id: string }>(),
    'Update Profile Weights': props<{ delta: Partial<Record<string, number>> }>(),
    'Set Profile Weights': props<{ weights: Record<string, number> }>(),
    'Apply Suggestion': props<{ id: string }>(),
    'Add Daily Focus': props<{ cardId: string }>(),
    'Remove Daily Focus': props<{ cardId: string }>(),
    'Clear Daily Focus': emptyProps()
  }
});
