import {
  Component,
  signal,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ItemsActions } from '../state/items.actions';

@Component({
  standalone: true,
  selector: 'app-items-capture',
  imports: [RouterLink],
  templateUrl: './items-capture.component.html',
  styleUrls: ['./items-capture.component.scss'],
})
export class ItemsCaptureComponent implements AfterViewInit {
  private store = inject(Store);
  title = signal('');
  quickMeta = computed(() => this.parseQuickMeta(this.title()));
  bulkMode = signal(false);
  bulkText = signal('');
  parsedPreview = signal<string[]>([]);
  parsedPreviewMeta = signal<
    Array<{ title: string; energyLevel?: number; estimateMinutes?: number; tags: string[] }>
  >([]);
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
  // Exposed for template preview parsing
  parseQuickMeta(raw: string) {
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
    const { cleanTitle, energyLevel, estimateMinutes, tags } = this.parseQuickMeta(raw);
    if (!cleanTitle) return;
    this.store.dispatch(
      ItemsActions.addItem({ title: cleanTitle, energyLevel, estimateMinutes, tags })
    );
    this.title.set('');
    this.liveMsg.set(`Item added: ${cleanTitle}`);
    this.titleInput?.nativeElement.focus();
  }
  toggleBulk() {
    this.bulkMode.set(!this.bulkMode());
    this.parsedPreview.set([]);
    if (!this.bulkMode()) {
      this.bulkText.set('');
    }
  }
  parseBulkInput(v: string) {
    const lines = v
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => !!l);
    this.bulkText.set(v);
    const titles: string[] = [];
    const meta: Array<{
      title: string;
      energyLevel?: number;
      estimateMinutes?: number;
      tags: string[];
    }> = [];
    lines.forEach((line) => {
      const { cleanTitle, energyLevel, estimateMinutes, tags } = this.parseQuickMeta(line);
      if (cleanTitle) {
        titles.push(cleanTitle);
        meta.push({ title: cleanTitle, energyLevel, estimateMinutes, tags });
      }
    });
    this.parsedPreview.set(titles);
    this.parsedPreviewMeta.set(meta);
  }
  submitBulk() {
    const lines = this.bulkText()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => !!l);
    if (!lines.length) return;
    const items: {
      title: string;
      energyLevel?: 1 | 2 | 3 | 4 | 5;
      estimateMinutes?: number;
      tags: string[];
    }[] = [];
    lines.forEach((line) => {
      const { cleanTitle, energyLevel, estimateMinutes, tags } = this.parseQuickMeta(line);
      if (cleanTitle) items.push({ title: cleanTitle, energyLevel, estimateMinutes, tags });
    });
    if (items.length) {
      this.store.dispatch(ItemsActions.addMany({ items }));
      this.liveMsg.set(`${items.length} items captured`);
    }
    this.bulkText.set('');
    this.parsedPreview.set([]);
    this.parsedPreviewMeta.set([]);
  }
  loadDemo() {
    this.store.dispatch(ItemsActions.loadDemo());
    this.showDemo.set(false);
    this.liveMsg.set('Demo items loaded');
  }
}
