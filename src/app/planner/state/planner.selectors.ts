import { createSelector } from '@ngrx/store';
import { AppState } from '../../store/app.state';
import { plannerFeatureKey, PlannerState } from './planner.models';
import { selectBoardState } from '../../kanban/state/board.selectors';

export const selectPlannerState = (s: AppState) => (s as any)[plannerFeatureKey] as PlannerState;
export const selectDailyFocusIds = createSelector(selectPlannerState, s => s.dailyFocusIds);
export const selectDailyFocusCards = createSelector(selectDailyFocusIds, selectBoardState, (ids, board) => ids.map((id: string) => board.cards[id]).filter(Boolean));
export const selectCandidateFocusCards = createSelector(selectDailyFocusIds, selectBoardState, (ids, board) => {
	const used = new Set(ids);
	const cards = Object.values(board.cards || {}) as any[];
	return cards
		.filter(c => !used.has(c.id) && !c.completed)
		.sort((a,b) => {
			// high > medium > low
			const prioOrder = (p:string) => p==='high'?0: p==='medium'?1:2;
			const pa = prioOrder(a.priority); const pb = prioOrder(b.priority);
			if(pa !== pb) return pa - pb;
			// earliest due date first (undefined last)
			if(a.dueDate && b.dueDate){ return a.dueDate.localeCompare(b.dueDate); }
			if(a.dueDate) return -1; if(b.dueDate) return 1; return a.title.localeCompare(b.title);
		})
		.slice(0,30);
});
