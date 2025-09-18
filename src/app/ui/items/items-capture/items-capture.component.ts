import { Component, signal, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ItemsActions } from '../state/items.actions';

@Component({
  standalone: true,
  selector: 'app-items-capture',
  imports: [NgIf, RouterLink],
  templateUrl: './items-capture.component.html',
  styleUrls: ['./items-capture.component.scss'],
})
export class ItemsCaptureComponent implements AfterViewInit {
  private store = inject(Store);
  title = signal('');
  showDemo = signal(true);
  liveMsg = signal('');
  @ViewChild('titleInput') titleInput?: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    // Auto-focus shortly after render to reduce initial friction
    queueMicrotask(() => this.titleInput?.nativeElement.focus());
  }
  onInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    this.title.set(v);
  }
  private parseQuickMeta(raw: string) {
    const tokens = raw.split(/\s+/);
    const tags: string[] = [];
    let energyLevel: 1 | 2 | 3 | 4 | 5 | undefined;
    let estimateMinutes: number | undefined;
    const titleParts: string[] = [];
    for (const t of tokens) {
      if (t.startsWith('#') && t.length > 1) {
        tags.push(t.substring(1));
        continue;
      }
      if (/^![1-5]$/.test(t)) {
        energyLevel = Number(t.substring(1)) as any;
        continue;
      }
      if (/^~\d+$/.test(t)) {
        estimateMinutes = Number(t.substring(1));
        continue;
      }
      titleParts.push(t);
    }
    return { cleanTitle: titleParts.join(' ').trim(), energyLevel, estimateMinutes, tags };
  }
  capture(ev: Event) {
    ev.preventDefault();
    const raw = this.title().trim();
    if (!raw) return;
    const { cleanTitle, energyLevel, estimateMinutes } = this.parseQuickMeta(raw);
    if (!cleanTitle) return;
    this.store.dispatch(ItemsActions.addItem({ title: cleanTitle, energyLevel, estimateMinutes }));
    this.title.set('');
    this.liveMsg.set(`Item added: ${cleanTitle}`);
    this.titleInput?.nativeElement.focus();
  }
  loadDemo() {
    this.store.dispatch(ItemsActions.loadDemo());
    this.showDemo.set(false);
    this.liveMsg.set('Demo items loaded');
  }
}
