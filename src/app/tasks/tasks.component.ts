import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TasksActions } from './state/tasks.actions';
import {
  selectFilteredTasks,
  selectTaskStats,
  selectCategories,
  selectFilters,
} from './state/tasks.selectors';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
})
export class TasksComponent {
  private store = inject(Store);
  tasks$ = this.store.select(selectFilteredTasks);
  stats$ = this.store.select(selectTaskStats);
  categories$ = this.store.select(selectCategories);
  filters$ = this.store.select(selectFilters);
  quick = signal('');
  showCompleted = signal(true);

  progressPct = computed(() => {
    // derive progress from stats stream not directly accessible here; will be bound via async pipe fallback
    return 0;
  });

  addQuick() {
    const title = this.quick().trim();
    if (!title) return;
    this.store.dispatch(TasksActions.addTask({ title }));
    this.quick.set('');
  }
  toggle(task: any) {
    this.store.dispatch(TasksActions.toggleComplete({ id: task.id }));
  }
  remove(task: any) {
    this.store.dispatch(TasksActions.deleteTask({ id: task.id }));
  }
  addCategory() {
    const name = prompt('Category name?');
    if (name) this.store.dispatch(TasksActions.addCategory({ name }));
  }
  filterText(v: string) {
    this.store.dispatch(TasksActions.setFilterText({ text: v }));
  }
  setCat(id?: string) {
    this.store.dispatch(TasksActions.setFilterCategory({ categoryId: id }));
  }
  setPriority(p: string) {
    this.store.dispatch(TasksActions.setFilterPriority({ priority: p as any }));
  }
  setDue(d: string) {
    this.store.dispatch(TasksActions.setFilterDue({ due: d || undefined }));
  }
  trackTask(_: number, t: any) {
    return t.id;
  }
  toggleShowCompleted() {
    this.showCompleted.update((v) => !v);
  }
  isOverdue(d?: string) {
    if (!d) return false;
    const date = new Date(d);
    const today = new Date();
    return !this.isCompletedDayDifference(date, today) && date < today && !this.isToday(d);
  }
  isToday(d?: string) {
    if (!d) return false;
    const date = new Date(d);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  isUpcoming(d?: string) {
    if (!d) return false;
    const date = new Date(d);
    const today = new Date();
    const diff = date.getTime() - today.getTime();
    return diff > 0 && diff < 1000 * 60 * 60 * 24 * 3;
  }
  private isCompletedDayDifference(a: Date, b: Date) {
    return false;
  }
  cyclePriority(task: any) {
    const next = task.priority === 'high' ? 'medium' : task.priority === 'medium' ? 'low' : 'high';
    this.store.dispatch(TasksActions.updateTask({ id: task.id, changes: { priority: next } }));
  }
  ngOnInit() {
  this.store.dispatch(TasksActions.init());
  }
}
