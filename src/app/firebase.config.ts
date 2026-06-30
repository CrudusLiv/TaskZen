import { InjectionToken } from '@angular/core';

export interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

export const FIREBASE_CONFIG_TOKEN = new InjectionToken<FirebaseEnvConfig>('FIREBASE_ENV_CONFIG');

// Attempt to load a local development config. If missing (e.g. CI), fall back to undefined.
// Avoids build break when `firebase.config.local.ts` is intentionally excluded or replaced in pipeline.
let localConfig: FirebaseEnvConfig | undefined;
try {
  // Dynamic import via Function constructor bypasses bundler static analysis;
  // used only for optional local-only config that must not break CI when absent.
  const mod = new Function('require', "return require('./firebase.config.local')")(
    typeof require !== 'undefined' ? require : undefined,
  ) as { firebaseEnv: FirebaseEnvConfig } | undefined;
  localConfig = mod?.firebaseEnv;
} catch {
  localConfig = undefined;
}

export const firebaseEnv: FirebaseEnvConfig | undefined = localConfig;
