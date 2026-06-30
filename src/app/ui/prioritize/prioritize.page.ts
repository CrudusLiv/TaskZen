import { Component, inject, Signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  selectTopThreeItems,
  selectItemsWithPriority,
  selectStuckTasks,
} from '../items/state/items.selectors';
import { ItemEntity } from '../items/state/items.actions';

type ScoredItem = ItemEntity & { _priorityScore: number };

@Component({
  standalone: true,
  selector: 'app-prioritize-page',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './prioritize.page.html',
  styleUrls: ['./prioritize.page.scss'],
})
export class PrioritizePage {
  private store = inject(Store);
  top3: Signal<ScoredItem[]> = this.store.selectSignal(selectTopThreeItems) as Signal<ScoredItem[]>;
  all: Signal<ScoredItem[]> = this.store.selectSignal(selectItemsWithPriority) as Signal<
    ScoredItem[]
  >;
  stuckTasks: Signal<ItemEntity[]> = this.store.selectSignal(selectStuckTasks);
  expanded = false;

  toggleExpanded() {
    this.expanded = !this.expanded;
  }
  daysAgo(updatedAt: string): number {
    return Math.floor((Date.now() - Date.parse(updatedAt)) / 86400000);
  }
}
