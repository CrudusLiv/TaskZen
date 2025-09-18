import { Component, signal, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ItemsActions } from '../state/items.actions';

@Component({
  standalone: true,
  selector: 'app-items-capture',
  imports: [NgIf, RouterLink],
  templateUrl: './items-capture.component.html',
  styleUrls: ['./items-capture.component.scss']
})
export class ItemsCaptureComponent {
  private store = inject(Store);
  title = signal('');
  showDemo = signal(true);
  onInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    this.title.set(v);
  }
  capture(ev: Event) {
    ev.preventDefault();
    const v = this.title().trim();
    if (!v) return;
    this.store.dispatch(ItemsActions.addItem({ title: v }));
    this.title.set('');
  }
  loadDemo() {
    this.store.dispatch(ItemsActions.loadDemo());
    this.showDemo.set(false);
  }
}
