import { createSelector } from '@ngrx/store';
import { selectAiState } from './planner.selectors';
import { selectBoardState } from '../../kanban/state/board.selectors';

export const selectDailyFocusIds = createSelector(selectAiState, s => s.dailyFocusIds);
export const selectDailyFocusCards = createSelector(selectDailyFocusIds, selectBoardState, (ids, board) => ids.map((id: string) => board.cards[id]).filter(Boolean));
