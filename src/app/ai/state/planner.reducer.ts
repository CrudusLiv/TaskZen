import { createReducer, on, createFeature } from '@ngrx/store';
import { PlannerActions } from './planner.actions';
import { initialAiState, aiFeatureKey } from './planner.models';

export const aiReducer = createReducer(
  initialAiState,
  on(PlannerActions.generationStarted, state => ({ ...state, generating: true })),
  on(PlannerActions.generationFailed, (state) => ({ ...state, generating: false })),
  on(PlannerActions.upsertSuggestions, (state, { suggestions }) => ({
    ...state,
    generating: false,
    suggestions: suggestions.reduce((acc, s) => { acc[s.id] = s; return acc; }, { ...state.suggestions })
  })),
  on(PlannerActions.clearSuggestions, state => ({ ...state, suggestions: {} })),
  on(PlannerActions.acceptSuggestion, (state, { id }) => ({ ...state, suggestions: { ...state.suggestions, [id]: { ...state.suggestions[id], accepted: true } } as any })),
  on(PlannerActions.rejectSuggestion, (state, { id }) => ({ ...state, suggestions: { ...state.suggestions, [id]: { ...state.suggestions[id], rejected: true } } as any })),
  on(PlannerActions.updateProfileWeights, (state, { delta }) => ({ ...state, profile: { ...state.profile, ...delta } })),
  on(PlannerActions.setProfileWeights, (state, { weights }) => ({ ...state, profile: { ...state.profile, ...weights } })),
  on(PlannerActions.applySuggestion, (state, { id }) => ({ ...state, suggestions: { ...state.suggestions, [id]: { ...state.suggestions[id], applied: true } }, dailyFocusIds: state.dailyFocusIds.includes(state.suggestions[id].cardId) ? state.dailyFocusIds : [...state.dailyFocusIds, state.suggestions[id].cardId] })),
  on(PlannerActions.addDailyFocus, (state, { cardId }) => ({ ...state, dailyFocusIds: state.dailyFocusIds.includes(cardId) ? state.dailyFocusIds : [...state.dailyFocusIds, cardId] })),
  on(PlannerActions.removeDailyFocus, (state, { cardId }) => ({ ...state, dailyFocusIds: state.dailyFocusIds.filter(id => id !== cardId) })),
  on(PlannerActions.clearDailyFocus, (state) => ({ ...state, dailyFocusIds: [] }))
);

export const aiFeature = createFeature({ name: aiFeatureKey, reducer: aiReducer });
