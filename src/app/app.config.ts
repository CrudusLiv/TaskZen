import {
  ApplicationConfig,
  ErrorHandler,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { GlobalErrorHandler } from './core/error/global-error-handler';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
// Hydration removed (SSR disabled)
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAppStore } from './app.store.module';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Firebase removed for Phase 0 (in-memory only)
    provideAnimations(),
    ...provideAppStore(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
