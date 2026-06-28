import { Component, computed, inject, signal, effect, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { Store } from '@ngrx/store';
import { ItemsActions, ItemEntity } from '../state/items.actions';
import { selectItemsFeature, selectAllTags } from '../state/items.selectors';

@Component({
  standalone: true,
  selector: 'app-items-list',
  imports: [NgClass, ClickOutsideDirective],
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.scss'],
})
export class ItemsListComponent implements OnDestroy {
  private store = inject(
    Store<{ items: { entities: Record<string, ItemEntity>; order: string[] } }>
  );
  // feature slice as a signal via proper selector (string key broke after refactors)
  state = this.store.selectSignal(selectItemsFeature);
  order = computed(() => this.state().order);
  statuses: ItemEntity['status'][] = ['inbox', 'next', 'progress', 'done'];
  liveMsg = signal('');
  enrichingId = signal<string | null>(null);
  enrichingItem = computed(() => {
    const id = this.enrichingId();
    if (!id) return null;
    return this.state().entities[id] || null;
  });
  editingId = signal<string | null>(null);
  editDraft = signal('');
  focusedIndex = signal<number>(0); // index in flattened filtered list
  private deleteArm = signal<string | null>(null); // id awaiting second confirm
  private deleteArmTimer: any;
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
    // global keyboard listeners (focus capture, close enrich)
    window.addEventListener('keydown', this.onGlobalKeydown);
  }

  private onGlobalKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
      const capture = document.querySelector<HTMLInputElement>('app-items-capture input[aria-describedby]');
      if (capture) {
        e.preventDefault();
        capture.focus();
      }
    }
    if (e.key === 'Escape' && this.enrichingId()) {
      this.closeEnrich();
    }
  };

  ngOnDestroy() {
    window.removeEventListener('keydown', this.onGlobalKeydown);
    clearTimeout(this.deleteArmTimer);
  }
  toggleEnrich(it: ItemEntity) {
    this.enrichingId.update((v) => (v === it.id ? null : it.id));
    queueMicrotask(() => {
      if (this.enrichingId() === it.id) {
        const panel = document.querySelector('.enrich-drawer');
        const first = panel?.querySelector<HTMLInputElement>('input');
        first?.focus();
      }
    });
  }
  startEdit(it: ItemEntity) {
    this.editingId.set(it.id);
    this.editDraft.set(it.title);
    // small async to allow input render then focus via custom event or query (handled in template via autofocus attr)
  }
  cancelEdit() {
    this.editingId.set(null);
    this.editDraft.set('');
  }
  commitEdit(it: ItemEntity) {
    const val = this.editDraft().trim();
    if (val && val !== it.title) {
      this.store.dispatch(ItemsActions.updateItem({ id: it.id, changes: { title: val } }));
      this.liveMsg.set(`${it.title} renamed to ${val}`);
    }
    this.cancelEdit();
  }
  closeEnrich() { this.enrichingId.set(null); }
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
  toggleStep(it: ItemEntity, index: number) {
    this.store.dispatch(ItemsActions.toggleMicroStep({ id: it.id, index }));
  }
  countCompletedSteps(it: ItemEntity) {
    if (!it.microStepsState) return 0;
    return it.microStepsState.reduce((a, b) => a + (b ? 1 : 0), 0);
  }
  // --- Autosave debounced handlers ---
  private debounceTimers = new Map<string, any>();
  private schedule(key: string, fn: () => void, delay = 420) {
    clearTimeout(this.debounceTimers.get(key));
    const t = setTimeout(fn, delay);
    this.debounceTimers.set(key, t);
  }
  inputField(it: ItemEntity, field: keyof ItemEntity, ev: Event) {
    const value = (ev.target as HTMLInputElement).value;
    this.schedule(it.id + ':' + field, () => {
      this.updateField(it, field, (value || '').trim());
    });
  }
  inputNumber(it: ItemEntity, field: keyof ItemEntity, ev: Event) {
    const raw = (ev.target as HTMLInputElement).value.trim();
    this.schedule(it.id + ':' + field, () => {
      if (raw === '') this.updateField(it, field, undefined);
      else {
        const n = Number(raw);
        this.updateField(it, field, isNaN(n) ? undefined : n);
      }
    }, 360);
  }
  inputMicroSteps(it: ItemEntity, ev: Event) {
    const raw = (ev.target as HTMLInputElement).value;
    this.schedule(it.id + ':microSteps', () => {
      const parts = raw
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length);
      this.updateField(it, 'microSteps', parts.length ? parts : undefined);
    }, 520);
  }
  // (outside click now handled via ClickOutsideDirective in template)
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
    // If currently editing this item, handle commit / cancel shortcuts
    if (this.editingId() === it.id) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        this.commitEdit(it);
        return;
      }
      if (ev.key === 'Escape') {
        ev.preventDefault();
        this.cancelEdit();
        return;
      }
    }
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      // Enter cycles unless we want edit on quick double? Keep simple: cycle status.
      this.cycle(it);
      return;
    }
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      this.moveFocus(1);
      return;
    }
    if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.moveFocus(-1);
      return;
    }
    if (ev.key === 'e' || ev.key === 'E') {
      ev.preventDefault();
      this.toggleEnrich(it);
      return;
    }
    if (ev.key === 'r' || ev.key === 'R') {
      ev.preventDefault();
      this.startEdit(it);
      return;
    }
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      this.armOrDelete(it.id, it.title);
      return;
    }
  }
  private armOrDelete(id: string, title: string) {
    // first press: arm, second within window deletes
    if (this.deleteArm() === id) {
      clearTimeout(this.deleteArmTimer);
      this.deleteArm.set(null);
      this.remove(id);
      return;
    }
    this.deleteArm.set(id);
    this.liveMsg.set(`Press delete again to remove ${title}`);
    clearTimeout(this.deleteArmTimer);
    this.deleteArmTimer = setTimeout(() => this.deleteArm.set(null), 1600);
  }
  private moveFocus(delta: number) {
    const ids = this.filteredIds();
    if (!ids.length) return;
    let next = this.focusedIndex() + delta;
    if (next < 0) next = 0;
    if (next >= ids.length) next = ids.length - 1;
    this.focusedIndex.set(next);
    // attempt to focus corresponding li
    queueMicrotask(() => {
      try {
        const listRoot = document.querySelector('section.list');
        if (!listRoot) return;
        const focusables = listRoot.querySelectorAll<HTMLLIElement>('li');
        const el = focusables[next];
        el?.focus();
      } catch {}
    });
  }
}
