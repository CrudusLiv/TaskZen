import { Component, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectTopThreeItems, selectItemsWithPriority } from '../items/state/items.selectors';

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
  constructor(private store: Store) {
    this.top3 = this.store.selectSignal(selectTopThreeItems) as any;
    this.all = this.store.selectSignal(selectItemsWithPriority) as any;
  }
  toggleExpanded() {
    this.expanded.update((v) => !v);
  }
}
