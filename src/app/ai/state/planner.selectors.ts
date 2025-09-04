import { createSelector } from '@ngrx/store';
import { AppState } from '../../store/app.state';
import { aiFeatureKey, AiState } from './planner.models';
import { selectBoardState } from '../../kanban/state/board.selectors';

export const selectAiState = (s: AppState) => (s as any)[aiFeatureKey] as AiState;
export const selectSuggestions = createSelector(selectAiState, s => Object.values(s.suggestions));
export const selectTopSuggestions = createSelector(selectSuggestions, list => [...list].sort((a,b)=> b.score - a.score).slice(0,10));
export const selectEnrichedTopSuggestions = createSelector(
	selectTopSuggestions,
	selectBoardState,
	(suggestions: any[], board) => suggestions.map(s => {
		const card = board?.cards?.[s.cardId];
		return {
			...s,
			cardTitle: card?.title || s.cardId,
			priority: card?.priority,
			dueDate: card?.dueDate
		};
	})
);
