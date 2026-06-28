import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorNotificationService {
  readonly message = signal<string | null>(null);

  setError(msg: string): void {
    this.message.set(msg);
  }

  dismiss(): void {
    this.message.set(null);
  }
}
