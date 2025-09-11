import { createReducer, on } from '@ngrx/store';
import { TasksActions, TaskItem, TaskCategory } from './tasks.actions';

export const tasksFeatureKey = 'tasks';

export interface TasksFilters {
  text: string;
  categoryId?: string;
  priority?: 'low' | 'medium' | 'high' | 'any';
  due?: string;
}
export interface TasksState {
  tasks: Record<string, TaskItem>;
  order: string[];
  categories: Record<string, TaskCategory>;
  catOrder: string[];
  filters: TasksFilters;
}

const initial: TasksState = {
  tasks: {},
  order: [],
  categories: {},
  catOrder: [],
  filters: { text: '', priority: 'any' },
};

function demo(): TasksState {
  const now = () => new Date().toISOString();
  const tasks: Record<string, TaskItem> = {};
  const order: string[] = [];
  const sample: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { title: 'Read chapter 4', description: 'Biology notes', priority: 'medium', completed: false },
    {
      title: 'Math worksheet',
      priority: 'high',
      completed: false,
      due: new Date(Date.now() + 86400000).toISOString(),
    },
    { title: 'Review flashcards', priority: 'low', completed: true },
  ];
  sample.forEach((t, i) => {
    const id = 't' + i;
    tasks[id] = { id, ...t, createdAt: now(), updatedAt: now() };
    order.push(id);
  });
  return { ...initial, tasks, order };
}

export const tasksReducer = createReducer(
  initial,
  on(TasksActions.loadDemo, () => demo()),
  on(TasksActions.replaceAllTasks, (s,{ tasks })=> {
    const rec: Record<string, TaskItem> = {};
    const order: string[] = [];
    tasks.forEach(t=> { rec[t.id] = t; order.push(t.id); });
    return { ...s, tasks: rec, order };
  }),
  on(TasksActions.addTask, (s, { title, description, due, priority = 'medium', categoryId }) => {
    const id = 't' + Date.now();
    const position = s.order.length ? s.order.length : 0;
    const task: TaskItem = {
      id,
      title,
      description,
      due,
      priority,
      categoryId,
      completed: false,
      position,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { ...s, tasks: { ...s.tasks, [id]: task }, order: [id, ...s.order] };
  }),
    on(TasksActions.reorderTasks, (s,{ orderedIds }) => {
      const updatedTasks = { ...s.tasks };
      orderedIds.forEach((id, idx)=> { if(updatedTasks[id]) updatedTasks[id] = { ...updatedTasks[id], position: idx }; });
      return { ...s, order: orderedIds, tasks: updatedTasks };
    }),
  on(TasksActions.updateTask, (s, { id, changes }) => {
    const t = s.tasks[id];
    if (!t) return s;
    const updated = { ...t, ...changes, updatedAt: new Date().toISOString() };
    return { ...s, tasks: { ...s.tasks, [id]: updated } };
  }),
  on(TasksActions.deleteTask, (s, { id }) => {
    if (!s.tasks[id]) return s;
    const { [id]: _, ...rest } = s.tasks;
    return { ...s, tasks: rest, order: s.order.filter((i) => i !== id) };
  }),
  on(TasksActions.toggleComplete, (s, { id }) => {
    const t = s.tasks[id];
    if (!t) return s;
    const updated = { ...t, completed: !t.completed, updatedAt: new Date().toISOString() };
    return { ...s, tasks: { ...s.tasks, [id]: updated } };
  }),
  on(TasksActions.addCategory, (s, { name }) => {
    const id = 'c' + Date.now();
    const cat: TaskCategory = { id, name };
    return { ...s, categories: { ...s.categories, [id]: cat }, catOrder: [...s.catOrder, id] };
  }),
  on(TasksActions.renameCategory, (s, { id, name }) => {
    const c = s.categories[id];
    if (!c) return s;
    return { ...s, categories: { ...s.categories, [id]: { ...c, name } } };
  }),
  on(TasksActions.deleteCategory, (s, { id }) => {
    if (!s.categories[id]) return s;
    const { [id]: _, ...rest } = s.categories;
    return {
      ...s,
      categories: rest,
      catOrder: s.catOrder.filter((c) => c !== id),
      tasks: Object.fromEntries(
        Object.entries(s.tasks).map(([tid, t]) => [
          tid,
          t.categoryId === id ? { ...t, categoryId: undefined } : t,
        ])
      ),
    };
  }),
  on(TasksActions.setFilterText, (s, { text }) => ({ ...s, filters: { ...s.filters, text } })),
  on(TasksActions.setFilterCategory, (s, { categoryId }) => ({
    ...s,
    filters: { ...s.filters, categoryId },
  })),
  on(TasksActions.setFilterPriority, (s, { priority }) => ({
    ...s,
    filters: { ...s.filters, priority },
  })),
  on(TasksActions.setFilterDue, (s, { due }) => ({ ...s, filters: { ...s.filters, due } }))
);
