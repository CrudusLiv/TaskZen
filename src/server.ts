import * as Sentry from '@sentry/node';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

if (process.env['SENTRY_DSN']) {
  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    environment: process.env['NODE_ENV'] || 'production',
    tracesSampleRate: 0.1,
  });
}

const browserDistFolder = join(import.meta.dirname, '../browser');

const { version } = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../package.json'), 'utf8'),
) as { version: string };

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Security middleware — applied before static file serving and route handlers.
 * Order: morgan → helmet → cors → compression → body-parser → rate-limit
 */

// 1. Request logging
app.use(
  morgan((tokens, req, res) => {
    return JSON.stringify({
      method: tokens['method'](req, res) ?? null,
      url: tokens['url'](req, res) ?? null,
      status: Number(tokens['status'](req, res)),
      duration: `${tokens['response-time'](req, res) ?? '0'} ms`,
      contentLength: tokens['res'](req, res, 'content-length') ?? null,
      userAgent: tokens['user-agent'](req, res) ?? null,
      ts: new Date().toISOString(),
    });
  }),
);

// 2. Security headers
app.use(helmet());

// 3. CORS policy
app.use(cors({ origin: process.env['ALLOWED_ORIGIN'] || '*' }));

// 4. Response compression
app.use(compression());

// 5. Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6. Health check — registered before rate limiting so load-balancer probes are never throttled
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), version });
});

// 7. Rate limiting — 100 requests per 15-minute window
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response: Response | null) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (process.env['SENTRY_DSN']) {
  Sentry.setupExpressErrorHandler(app);
}

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  const server = app.listen(port, (error?: Error) => {
    if (error) throw error;
    console.log(`Node Express server listening on http://localhost:${port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`[server] ${signal} received — shutting down gracefully`);
    server.close(() => {
      console.log('[server] All connections closed. Exiting.');
      process.exit(0);
    });
    // Force exit if connections hang
    setTimeout(() => {
      console.error('[server] Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
