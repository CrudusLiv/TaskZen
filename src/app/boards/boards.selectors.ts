import { createFeatureSelector, createSelector } from '@ngrx/store';
import { boardsFeatureKey } from './boards.reducer';
import { BoardsState } from './boards.models';

export const selectBoardsState = createFeatureSelector<BoardsState>(boardsFeatureKey);
export const selectAllBoards = createSelector(selectBoardsState, s => s.order.map(id => s.boards[id]));
export const selectFavoriteBoards = createSelector(selectAllBoards, boards => boards.filter(b=>b.favorite));
export const selectNonFavoriteBoards = createSelector(selectAllBoards, boards => boards.filter(b=>!b.favorite));
export const selectActiveBoardMeta = createSelector(selectBoardsState, s => s.activeBoardId ? s.boards[s.activeBoardId] : undefined);
export const selectActiveBoardId = createSelector(selectBoardsState, s => s.activeBoardId);
export const selectLastDeletedBoard = createSelector(selectBoardsState, s => s.lastDeleted);
