import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { firebaseEnv } from './firebase.config';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from '@angular/fire/firestore';
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
      provideFirestore(()=> {
        try {
          return initializeFirestore(undefined as any, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
          });
        } catch(err){
          console.warn('[app.config] initializeFirestore persistent cache failed, retrying default:', err);
          // Fallback: AngularFire will create default instance internally
          return initializeFirestore(undefined as any, {} as any);
        }
      })
    ] : []),
    provideAnimations(),
    ...provideAppStore()
  ]
};
