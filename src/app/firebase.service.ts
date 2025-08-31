import { Injectable } from '@angular/core';
import { firebaseEnv } from './firebase.config';
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { Store } from '@ngrx/store';
import { AppActions } from './store/app.actions';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private app: FirebaseApp | null = null;
  private authInstance: Auth | null = null;
  private dbInstance: Firestore | null = null;
  initialized = false;

  constructor(private store: Store){ }

  init(){
    if(this.initialized) return;
    if(!firebaseEnv){
      console.warn('[FirebaseService] firebaseEnv missing – initialization skipped');
      this.store.dispatch(AppActions.error({ message: 'Firebase config missing. Nothing will persist.' }));
      return;
    }
    try {
      const existing = getApps();
      if(existing.length){
        this.app = existing[0];
        console.info('[FirebaseService] Reusing existing Firebase app');
      } else {
        this.app = initializeApp(firebaseEnv as any);
        console.info('[FirebaseService] Initialized new Firebase app');
      }
      this.authInstance = getAuth(this.app);
      this.dbInstance = getFirestore(this.app);
      enableIndexedDbPersistence(this.dbInstance).catch(()=>{});
      this.initialized = true;
      // lightweight connectivity write (will create diagnostics doc if rules allow)
  console.info('[FirebaseService] Firebase initialized with projectId:', firebaseEnv.projectId, 'appId:', firebaseEnv.appId);
    } catch (e){
      console.error('[FirebaseService] Init failed', e);
      this.store.dispatch(AppActions.error({ message: 'Firebase init failed. Check console.' }));
    }
  }

  get auth(){ return this.authInstance; }
  get db(){ return this.dbInstance; }
}
