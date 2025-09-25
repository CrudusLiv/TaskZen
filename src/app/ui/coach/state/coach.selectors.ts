import { createFeatureSelector, createSelector } from '@ngrx/store';
import { coachFeatureKey } from './coach.actions';
import { CoachState } from './coach.reducer';

export const selectCoachFeature = createFeatureSelector<CoachState>(coachFeatureKey);
export const selectCoachCards = createSelector(selectCoachFeature, (s) =>
  s.cards.filter((c) => !c.dismissed)
);
export const selectPinnedCoachCards = createSelector(selectCoachFeature, (s) =>
  s.cards.filter((c) => c.pinned)
);
