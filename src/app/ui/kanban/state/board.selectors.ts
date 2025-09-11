import { createFeatureSelector, createSelector } from '@ngrx/store';
import { boardFeatureKey } from './board.reducer';
import { BoardState } from './board.models';
import { selectDailyFocusIds } from '../../planner/state/planner.selectors';

export const selectBoardState = createFeatureSelector<BoardState>(boardFeatureKey);
export const selectBoard = createSelector(selectBoardState, (s) => s.board);
export const selectColumns = createSelector(selectBoardState, (s) =>
  s.board.columnIds.map((id) => s.columns[id])
);
export const selectFilter = createSelector(selectBoardState, (s) => s.filter);
export const selectActiveCard = createSelector(selectBoardState, (s) =>
  s.activeCardId ? s.cards[s.activeCardId] : undefined
);
export const selectLastDeleted = createSelector(selectBoardState, (s) => s.lastDeleted);
export const selectColumnCards = (columnId: string) =>
  createSelector(
    selectBoardState,
    (s) => s.columns[columnId]?.cardIds.map((id) => s.cards[id]) || []
  );
export const selectFilteredColumnCards = (columnId: string) =>
  createSelector(selectColumnCards(columnId), selectFilter, (cards, filter) => {
    if (!filter) return cards;
    return cards.filter((c) => {
      if (filter.text) {
        const t = filter.text.toLowerCase();
        if (!(c.title.toLowerCase().includes(t) || (c.description || '').toLowerCase().includes(t)))
          return false;
      }
      if (filter.priority && filter.priority !== 'any' && c.priority !== filter.priority)
        return false;
      if (filter.due && c.dueDate !== filter.due) return false;
      return true;
    });
  });

export const selectUnscheduledCards = createSelector(
  selectBoardState,
  selectDailyFocusIds,
  (bs: any, focusIds: string[]) => {
    const cards = Object.values(bs.cards || {}) as any[];
    const focusSet = new Set(focusIds);
    const prio = (p: string) => (p === 'high' ? 0 : p === 'medium' ? 1 : 2);
    return cards
      .filter((c) => !c.dueDate && !c.completed)
      .sort((a, b) => {
        const pa = prio(a.priority),
          pb = prio(b.priority);
        if (pa !== pb) return pa - pb;
        return a.title.localeCompare(b.title);
      })
      .slice(0, 50)
      .map((c) => ({ ...c, inFocus: focusSet.has(c.id) }));
  }
);

// Daily focus cards derived by IDs (lives here to avoid circular dependency with planner selectors)
export const selectDailyFocusCards = createSelector(
  selectBoardState,
  selectDailyFocusIds,
  (bs: any, ids: string[]) => ids.map((id: string) => bs.cards[id]).filter(Boolean)
);

// Candidate focus cards (not in focus, not completed) sorted by priority, then earliest due date, then title
export const selectCandidateFocusCards = createSelector(
  selectBoardState,
  selectDailyFocusIds,
  (bs: any, ids: string[]) => {
    const used = new Set(ids);
    const cards = Object.values(bs.cards || {}) as any[];
    const prioOrder = (p: string) => (p === 'high' ? 0 : p === 'medium' ? 1 : 2);
    return cards
      .filter((c) => !used.has(c.id) && !c.completed)
      .sort((a: any, b: any) => {
        const pa = prioOrder(a.priority),
          pb = prioOrder(b.priority);
        if (pa !== pb) return pa - pb;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.title.localeCompare(b.title);
      })
      .slice(0, 30);
  }
);
