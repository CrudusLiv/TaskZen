import { createFeatureSelector, createSelector } from '@ngrx/store';
import { tasksFeatureKey, TasksState } from './tasks.reducer';

export const selectTasksState = createFeatureSelector<TasksState>(tasksFeatureKey);
export const selectAllTaskEntities = createSelector(selectTasksState, (s) => s.tasks);
export const selectTaskOrder = createSelector(selectTasksState, (s) => s.order);
export const selectAllTasks = createSelector(
  selectAllTaskEntities,
  selectTaskOrder,
  (ents, order) => order.map((id) => ents[id])
);
export const selectFilters = createSelector(selectTasksState, (s) => s.filters);
export const selectFilteredTasks = createSelector(selectAllTasks, selectFilters, (tasks, f) =>
  tasks.filter((t) => {
    if (
      f.text &&
      !(t.title + ' ' + (t.description || '')).toLowerCase().includes(f.text.toLowerCase())
    )
      return false;
    if (f.categoryId && t.categoryId !== f.categoryId) return false;
    if (f.priority && f.priority !== 'any' && t.priority !== f.priority) return false;
    if (f.due && (!t.due || t.due.split('T')[0] !== f.due)) return false;
    return true;
  })
);
export const selectTaskStats = createSelector(selectAllTasks, (tasks) => ({
  total: tasks.length,
  completed: tasks.filter((t) => t.completed).length,
}));
export const selectCategories = createSelector(selectTasksState, (s) =>
  s.catOrder.map((id) => s.categories[id])
);
