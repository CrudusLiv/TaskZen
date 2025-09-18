import { Injectable, signal } from '@angular/core';
import { ItemEntity } from '../ui/items/state/items.actions';

@Injectable({ providedIn: 'root' })
export class ItemsDataService {
  private items = signal<Record<string, ItemEntity>>({});

  all() {
    return Object.values(this.items());
  }

  save(item: ItemEntity) {
    this.items.update((m) => ({ ...m, [item.id]: item }));
  }

  bulkReplace(list: ItemEntity[]) {
    const rec: Record<string, ItemEntity> = {};
    list.forEach((i) => {
      rec[i.id] = i;
    });
    this.items.set(rec);
  }
}
