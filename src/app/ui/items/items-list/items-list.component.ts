import { Component, computed, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { ItemsActions, ItemEntity } from '../state/items.actions';

@Component({
  standalone: true,
  selector: 'app-items-list',
  imports: [NgFor, NgIf],
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.scss']
})
export class ItemsListComponent {
  private store = inject(
    Store<{ items: { entities: Record<string, ItemEntity>; order: string[] } }>
  );
  order = computed(() => this.state().order);
  state = computed(() => (this as any).store.selectSignal('items')());
  statuses: ItemEntity['status'][] = ['inbox', 'next', 'progress', 'done'];
  byStatus(status: ItemEntity['status']) {
    const st = this.state();
    return st.order
      .map((id: string) => st.entities[id])
      .filter((e: ItemEntity) => e && e.status === status);
  }
  cycle(it: ItemEntity) {
    const seq: ItemEntity['status'][] = ['inbox', 'next', 'progress', 'done'];
    const idx = seq.indexOf(it.status);
    const next = seq[(idx + 1) % seq.length];
    this.store.dispatch(ItemsActions.moveStatus({ id: it.id, status: next }));
  }
  remove(id: string) {
    this.store.dispatch(ItemsActions.deleteItem({ id }));
  }
}
