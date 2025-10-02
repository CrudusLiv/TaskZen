import { Component, computed, inject, signal, effect } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { ItemsActions, ItemEntity } from '../state/items.actions';
import { selectItemsFeature, selectAllTags } from '../state/items.selectors';

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
  // Tag filter state
  allTags = this.store.selectSignal(selectAllTags);
  selectedTags = signal<Set<string>>(new Set());
  search = signal('');
  // Derived filtered order list (IDs) for quick membership tests
  filteredIds = computed(() => {
    const st = this.state();
    const term = this.search().trim().toLowerCase();
    const needTags = this.selectedTags();
    if (!term && needTags.size === 0) return st.order;
    return st.order.filter((id) => {
      const it = st.entities[id];
      if (!it) return false;
      if (term) {
        const blob = (
          it.title +
          ' ' +
          (it.description || '') +
          ' ' +
          (it.tags || []).join(' ')
        ).toLowerCase();
        if (!blob.includes(term)) return false;
      }
      if (needTags.size) {
        const tags = (it.tags || []).map((t) => t.toLowerCase());
        for (const t of needTags) if (!tags.includes(t)) return false;
      }
      return true;
    });
  });
  toggleTag(tag: string) {
    const lower = tag.toLowerCase();
    this.selectedTags.update((set) => {
      const next = new Set(set);
      if (next.has(lower)) next.delete(lower);
      else next.add(lower);
      return next;
    });
  }
  clearFilters() {
    this.selectedTags.set(new Set());
    this.search.set('');
  }
  isTagActive(tag: string) {
    return this.selectedTags().has(tag.toLowerCase());
  }
  tagList = computed(() => Array.from(this.selectedTags()).sort());
  private storageKey = 'itemsFilters:v1';
  constructor() {
    // load persisted filters (non-blocking)
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.tags)) {
          this.selectedTags.set(new Set(parsed.tags.map((t: string) => t.toLowerCase())));
        }
        if (typeof parsed.search === 'string') {
          this.search.set(parsed.search.slice(0, 120));
        }
      }
    } catch {}
    // persist on changes (debounced via microtask batching using effect + timeout)
    let t: any;
    const save = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        try {
          const payload = {
            tags: Array.from(this.selectedTags()),
            search: this.search(),
          };
          localStorage.setItem(this.storageKey, JSON.stringify(payload));
        } catch {}
      }, 120);
    };
    // effect watchers
    (window as any).queueMicrotask?.(() => {}); // noop to ensure microtask polyfill presence if needed
    const that = this;
    // minimal custom watch since Angular signals effect is tree-shakable; use dynamic import guard if SSR later
    effect(() => {
      // dependencies
      this.selectedTags();
      this.search();
      save();
    });
  }
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
    const filtered = this.filteredIds();
    return filtered
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
