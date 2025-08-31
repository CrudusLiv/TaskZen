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

// Static import ensures the local config file (gitignored) is bundled in dev.
// If you deploy and want to supply config differently, adapt this (e.g., replace at build time).
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { firebaseEnv as localConfig } from './firebase.config.local';

export const firebaseEnv: FirebaseEnvConfig | undefined = localConfig;
