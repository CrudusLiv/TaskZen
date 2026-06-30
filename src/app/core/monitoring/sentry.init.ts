import * as Sentry from '@sentry/angular';

export function initSentry(): void {
  if (typeof window === 'undefined') return;
  const dsn = (window as { __SENTRY_DSN__?: string }).__SENTRY_DSN__;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: 'production',
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  });
}
