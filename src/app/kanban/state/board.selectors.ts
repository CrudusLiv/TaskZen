import { createFeatureSelector, createSelector } from '@ngrx/store';
import { boardFeatureKey } from './board.reducer';
import { BoardState } from './board.models';

export const selectBoardState = createFeatureSelector<BoardState>(boardFeatureKey);
export const selectBoard = createSelector(selectBoardState, s => s.board);
export const selectColumns = createSelector(selectBoardState, s => s.board.columnIds.map(id => s.columns[id]));
export const selectFilter = createSelector(selectBoardState, s => s.filter);
export const selectActiveCard = createSelector(selectBoardState, s => s.activeCardId ? s.cards[s.activeCardId] : undefined);
export const selectLastDeleted = createSelector(selectBoardState, s => s.lastDeleted);
export const selectColumnCards = (columnId: string) => createSelector(
  selectBoardState,
  s => s.columns[columnId]?.cardIds.map(id => s.cards[id]) || []
);
export const selectFilteredColumnCards = (columnId: string) => createSelector(
  selectColumnCards(columnId),
  selectFilter,
  (cards, filter) => {
    if(!filter) return cards;
    return cards.filter(c => {
      if(filter.text){
        const t = filter.text.toLowerCase();
        if(!(c.title.toLowerCase().includes(t) || (c.description||'').toLowerCase().includes(t))) return false;
      }
      if(filter.priority && filter.priority !== 'any' && c.priority !== filter.priority) return false;
      if(filter.due && c.dueDate !== filter.due) return false;
      return true;
    });
  }
);
