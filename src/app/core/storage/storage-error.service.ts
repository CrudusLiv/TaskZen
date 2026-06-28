import { Injectable, signal } from '@angular/core';

/**
 * Signals a storage load failure to the UI layer.
 * The persistence effects call showLoadError() when the encrypted store
 * can't be decrypted or read; the StorageErrorBannerComponent displays
 * a calm message to the user.
 */
@Injectable({ providedIn: 'root' })
export class StorageErrorService {
  readonly loadFailed = signal(false);

  showLoadError(): void {
    this.loadFailed.set(true);
  }

  dismiss(): void {
    this.loadFailed.set(false);
  }
}
