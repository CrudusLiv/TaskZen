import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RateLimitService {
  private timers = new Map<string, any>();

  debounce(key: string, delay: number, fn: () => void){
    const existing = this.timers.get(key);
    if(existing) clearTimeout(existing);
    const t = setTimeout(()=> { this.timers.delete(key); fn(); }, delay);
    this.timers.set(key, t);
  }
}