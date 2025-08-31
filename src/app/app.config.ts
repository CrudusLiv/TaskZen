import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { firebaseEnv } from './firebase.config';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore, enableIndexedDbPersistence } from '@angular/fire/firestore';
// Hydration removed (SSR disabled)
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAppStore } from './app.store.module';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    ...(firebaseEnv ? [
      provideFirebaseApp(()=> initializeApp(firebaseEnv as any)),
      provideAuth(()=> getAuth()),
      provideFirestore(()=> { const db = getFirestore(); try { enableIndexedDbPersistence(db); } catch {} return db; })
    ] : []),
    provideAnimations(),
    ...provideAppStore()
  ]
};
