import { createReducer, on } from '@ngrx/store';
import { CoachActions, CoachCard, coachFeatureKey } from './coach.actions';

export interface CoachState {
  cards: CoachCard[]; // newest first
}

const initial: CoachState = { cards: [] };

export const coachReducer = createReducer(
  initial,
  on(CoachActions.hydrate, (s, { cards }) => ({ cards: [...cards] })),
  on(CoachActions.addCard, (s, { card }) => ({ cards: [card, ...s.cards].slice(0, 200) })),
  on(CoachActions.dismissCard, (s, { id }) => ({
    cards: s.cards.map((c) => (c.id === id ? { ...c, dismissed: true } : c)),
  })),
  on(CoachActions.pinCard, (s, { id }) => ({
    cards: s.cards.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
  })),
  on(CoachActions.pruneOld, (s) => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 7; // 7 days
    return { cards: s.cards.filter((c) => new Date(c.createdAt).getTime() >= cutoff || c.pinned) };
  }),
);

export { coachFeatureKey };
export type { CoachCard };
