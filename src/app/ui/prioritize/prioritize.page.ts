import { Component, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectTopThreeItems, selectItemsWithPriority, selectStuckTasks } from '../items/state/items.selectors';

@Component({
  standalone: true,
  selector: 'app-prioritize-page',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './prioritize.page.html',
  styleUrls: ['./prioritize.page.scss'],
})
export class PrioritizePage {
  top3 = signal<any[]>([]);
  all = signal<any[]>([]);
  expanded = signal(false);
  stuckTasks = signal<any[]>([]);
  constructor(private store: Store) {
    this.top3 = this.store.selectSignal(selectTopThreeItems) as any;
    this.all = this.store.selectSignal(selectItemsWithPriority) as any;
    this.stuckTasks = this.store.selectSignal(selectStuckTasks) as any;
  }
  toggleExpanded() {
    this.expanded.update((v) => !v);
  }
  daysAgo(updatedAt: string): number {
    return Math.floor((Date.now() - Date.parse(updatedAt)) / 86400000);
  }
}
