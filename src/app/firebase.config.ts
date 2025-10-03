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
// eslint-disable-next-line @typescript-eslint/consistent-type-imports, @typescript-eslint/no-explicit-any
let localConfig: any = undefined;
try {
  // Using require inside try so TS still emits dynamic resolution; if bundler tree-shakes, ensure file exists locally.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  localConfig = (require('./firebase.config.local') as { firebaseEnv: FirebaseEnvConfig }).firebaseEnv;
} catch {
  localConfig = undefined;
}

export const firebaseEnv: FirebaseEnvConfig | undefined = localConfig;
