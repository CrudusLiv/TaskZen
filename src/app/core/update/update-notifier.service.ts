import { Injectable, signal } from '@angular/core';

/**
 * Periodically checks for a new deployed version by issuing a HEAD/GET request for index.html
 * and comparing ETag (or last-modified / content length hash) with the first seen value.
 */
@Injectable({ providedIn: 'root' })
export class UpdateNotifierService {
  private initialTag: string | null = null;
  private lastCheckTag: string | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  readonly updateAvailable = signal(false);

  start(intervalMs = 60000) {
    if (this.timer) return;
    this.check();
    this.timer = setInterval(() => this.check(), intervalMs);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
  private async check() {
    try {
      // Use a cache-busting query param to ensure we hit the network for index.html
      const res = await fetch(`index.html?cb=${Date.now()}`, { method: 'GET', cache: 'no-store' });
      let tag = res.headers.get('ETag');
      if (!tag) {
        // fallback: synthesize from content length + last-modified
        const lm = res.headers.get('Last-Modified') || '';
        const text = await res.text();
        tag = 'len:' + text.length + '|lm:' + lm;
      }
      if (this.initialTag == null) {
        this.initialTag = tag;
        this.lastCheckTag = tag;
        return;
      }
      this.lastCheckTag = tag;
      if (tag !== this.initialTag) {
        this.updateAvailable.set(true);
      }
    } catch {
      // swallow network errors silently
    }
  }
}
