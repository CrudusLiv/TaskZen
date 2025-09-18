import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { ItemsActions, ItemEntity } from '../state/items.actions';
import { selectItemsFeature } from '../state/items.selectors';

@Component({
  standalone: true,
  selector: 'app-items-list',
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.scss'],
})
export class ItemsListComponent {
  private store = inject(
    Store<{ items: { entities: Record<string, ItemEntity>; order: string[] } }>
  );
  // feature slice as a signal via proper selector (string key broke after refactors)
  state = this.store.selectSignal(selectItemsFeature);
  order = computed(() => this.state().order);
  statuses: ItemEntity['status'][] = ['inbox', 'next', 'progress', 'done'];
  liveMsg = signal('');
  enrichingId = signal<string | null>(null);
  toggleEnrich(it: ItemEntity) {
    this.enrichingId.update((v) => (v === it.id ? null : it.id));
  }
  closeEnrich() {
    this.enrichingId.set(null);
  }
  updateField(it: ItemEntity, field: keyof ItemEntity, value: any) {
    const parsed = value === '' ? undefined : value;
    this.store.dispatch(
      ItemsActions.updateItem({ id: it.id, changes: { [field]: parsed } as any })
    );
  }
  updateNumber(it: ItemEntity, field: keyof ItemEntity, ev: Event) {
    const val = (ev.target as HTMLInputElement).value.trim();
    const num = val === '' ? undefined : Number(val);
    this.updateField(it, field, isNaN(num as number) ? undefined : num);
  }
  updateMicroSteps(it: ItemEntity, ev: Event) {
    const raw = (ev.target as HTMLInputElement).value;
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length);
    this.updateField(it, 'microSteps', parts.length ? parts : undefined);
  }
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
    this.liveMsg.set(`${it.title} moved to ${next}`);
  }
  remove(id: string) {
    const ent = this.state().entities[id];
    this.store.dispatch(ItemsActions.deleteItem({ id }));
    if (ent) this.liveMsg.set(`${ent.title} deleted`);
  }
  onKey(ev: KeyboardEvent, it: ItemEntity) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.cycle(it);
    }
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      this.remove(it.id);
    }
  }
}
