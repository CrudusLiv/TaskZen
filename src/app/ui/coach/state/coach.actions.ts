import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface CoachCard {
  id: string;
  category: string; // Focus, Energy, Routines, Mindset
  title: string;
  body: string;
  suggestion?: string;
  createdAt: string;
  dismissed?: boolean;
  pinned?: boolean;
  ruleId?: string;
}

export const coachFeatureKey = 'coach';

export const CoachActions = createActionGroup({
  source: 'Coach',
  events: {
    Init: emptyProps(),
    'Hydrate': props<{ cards: CoachCard[] }>(),
    'Generate Card': props<{ card: Omit<CoachCard, 'id' | 'createdAt'> }>(),
    'Add Card': props<{ card: CoachCard }>(),
    'Dismiss Card': props<{ id: string }>(),
    'Pin Card': props<{ id: string }>(),
    'Evaluate Rules': emptyProps(),
    'Prune Old': emptyProps(),
  }
});
