import { ErrorHandler, inject, Injector, Injectable } from '@angular/core';
import { ErrorNotificationService } from './error-notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);
    try {
      const svc = this.injector.get(ErrorNotificationService);
      const msg = error instanceof Error ? error.message : 'An unexpected error occurred.';
      svc.setError(msg);
    } catch {
      // service unavailable during bootstrap — skip
    }
  }
}
