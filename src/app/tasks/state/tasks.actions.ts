import { createActionGroup, props, emptyProps } from '@ngrx/store';

export interface TaskItem { id: string; title: string; description?: string; due?: string; priority: 'low'|'medium'|'high'; completed: boolean; categoryId?: string; position?: number; createdAt: string; updatedAt: string; }
export interface TaskCategory { id: string; name: string; }

export const TasksActions = createActionGroup({
  source: 'Tasks',
  events: {
    'Init': emptyProps(),
  'Add Task': props<{ title: string; description?: string; due?: string; priority?: 'low'|'medium'|'high'; categoryId?: string }>(),
    'Add Task Success': props<{ task: TaskItem }>(),
  'Replace All Tasks': props<{ tasks: TaskItem[] }>(),
    'Update Task': props<{ id: string; changes: Partial<Omit<TaskItem,'id'|'createdAt'>> }>(),
    'Delete Task': props<{ id: string }>(),
    'Toggle Complete': props<{ id: string }>(),
    'Add Category': props<{ name: string }>(),
    'Rename Category': props<{ id: string; name: string }>(),
    'Delete Category': props<{ id: string }>(),
    'Set Filter Text': props<{ text: string }>(),
    'Set Filter Category': props<{ categoryId?: string }>(),
    'Set Filter Priority': props<{ priority?: 'low'|'medium'|'high'|'any' }>(),
    'Set Filter Due': props<{ due?: string }>(),
  'Reorder Tasks': props<{ orderedIds: string[] }>(),
    'Load Demo': emptyProps()
  }
});
