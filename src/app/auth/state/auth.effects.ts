import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthActions, UserProfile } from './auth.actions';
import { map, switchMap, catchError, of, tap, from, mergeMap } from 'rxjs';
import { FirebaseService } from '../../firebase.service';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private firebase = inject(FirebaseService);

  private ensureInit(){
    this.firebase.init();
  }

  // Listen to auth state once restore requested (or app start if desired)
  restore$ = createEffect(()=> this.actions$.pipe(
    ofType(AuthActions.restoreSession),
    tap(()=> this.ensureInit()),
    switchMap(()=> new Promise<any>(resolve => {
      const auth = this.firebase.auth!;
      const unsub = onAuthStateChanged(auth, async user => {
        unsub();
        if(user){
          const db = getFirestore();
            const ref = doc(db, 'users', user.uid);
            const snap = await getDoc(ref).catch(()=>undefined);
            let profile: UserProfile = {
              id: user.uid,
              email: user.email||'',
              name: user.displayName|| user.email?.split('@')[0] || 'User',
              roles: (snap?.exists() && (snap.data() as any).roles) || ['user'],
              createdAt: snap?.exists()? (snap.data() as any).createdAt || new Date().toISOString(): new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            resolve(AuthActions.loginSuccess({ user: profile, token: await user.getIdToken() }));
        } else {
          resolve(AuthActions.logoutSuccess());
        }
      });
    }))
  ));

  signup$ = createEffect(()=> this.actions$.pipe(
    ofType(AuthActions.signup),
    tap(()=> this.ensureInit()),
    switchMap(({ email, password, name })=> from(createUserWithEmailAndPassword(this.firebase.auth!, email, password)).pipe(
      switchMap(async cred => {
        if(name) await updateProfile(cred.user, { displayName: name });
        const db = getFirestore();
        const ref = doc(db, 'users', cred.user.uid);
        await setDoc(ref, {
          uid: cred.user.uid,
          email: cred.user.email,
            displayName: name || cred.user.displayName || email.split('@')[0],
          roles: ['user'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        const user: UserProfile = {
          id: cred.user.uid,
          email: cred.user.email||'',
          name: name || cred.user.displayName || email.split('@')[0],
          roles: ['user'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return AuthActions.signupSuccess({ user, token: await cred.user.getIdToken() });
      }),
      catchError(err=> of(AuthActions.signupFailure({ error: err.message||'Signup failed' })))
    ))
  ));

  login$ = createEffect(()=> this.actions$.pipe(
    ofType(AuthActions.login),
    tap(()=> this.ensureInit()),
    switchMap(({ email, password })=> from(signInWithEmailAndPassword(this.firebase.auth!, email, password)).pipe(
      switchMap(async cred => {
        const db = getFirestore();
        const ref = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(ref).catch(()=>undefined);
        const roles = snap?.exists()? (snap.data() as any).roles || ['user'] : ['user'];
        const user: UserProfile = {
          id: cred.user.uid,
          email: cred.user.email||'',
          name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
          roles,
          createdAt: snap?.exists()? (snap.data() as any).createdAt || new Date().toISOString(): new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return AuthActions.loginSuccess({ user, token: await cred.user.getIdToken() });
      }),
      catchError(err=> of(AuthActions.loginFailure({ error: err.message||'Login failed' })))
    ))
  ));

  loginProvider$ = createEffect(()=> this.actions$.pipe(
    ofType(AuthActions.loginWithProvider),
    tap(()=> this.ensureInit()),
    switchMap(({ provider })=> {
      const auth = this.firebase.auth!;
      const prov = new GoogleAuthProvider(); // only google for now
      return from(signInWithPopup(auth, prov)).pipe(
        switchMap(async cred => {
          const db = getFirestore();
          const ref = doc(db, 'users', cred.user.uid);
          await setDoc(ref, {
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: cred.user.displayName || cred.user.email?.split('@')[0],
            roles: ['user'],
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          }, { merge: true });
          const user: UserProfile = {
            id: cred.user.uid,
            email: cred.user.email||'',
            name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
            roles: ['user'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return AuthActions.loginWithProviderSuccess({ user, token: await cred.user.getIdToken(), provider });
        }),
        catchError(err=> of(AuthActions.loginWithProviderFailure({ error: err.message||'Provider login failed', provider })))
      );
    })
  ));

  persist$ = createEffect(()=> this.actions$.pipe(
    ofType(AuthActions.loginSuccess, AuthActions.signupSuccess, AuthActions.loginWithProviderSuccess),
    tap(async ({ token })=>{
      try { localStorage.setItem('tz.session', JSON.stringify({ token })); } catch {}
    })
  ), { dispatch:false });

  logout$ = createEffect(()=> this.actions$.pipe(
    ofType(AuthActions.logout),
    tap(()=> this.ensureInit()),
    switchMap(()=> from(this.firebase.auth!.signOut()).pipe(
      tap(()=>{ try { localStorage.removeItem('tz.session'); } catch {} }),
      map(()=> AuthActions.logoutSuccess()),
      catchError(()=> of(AuthActions.logoutSuccess()))
    ))
  ));

  updateProfile$ = createEffect(()=> this.actions$.pipe(
    ofType(AuthActions.updateProfile),
    tap(()=> this.ensureInit()),
    switchMap(({ changes })=> {
      const user = this.firebase.auth?.currentUser; if(!user) return of(AuthActions.updateProfileFailure({ error: 'Not authenticated' }));
      const db = getFirestore();
      const ref = doc(db, 'users', user.uid);
      return from(setDoc(ref, { ...changes, updatedAt: serverTimestamp() }, { merge: true })).pipe(
        switchMap(()=> from(getDoc(ref)).pipe(
          map(snap=> {
            const data: any = snap.data()||{};
            const profile: UserProfile = {
              id: user.uid,
              email: user.email||'',
              name: data.displayName || data.name || user.displayName || user.email?.split('@')[0] || 'User',
              roles: data.roles||['user'],
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              avatarUrl: data.avatarUrl,
              username: data.username,
              bio: data.bio
            } as any;
            return AuthActions.updateProfileSuccess({ user: profile });
          })
        )),
        catchError(err=> of(AuthActions.updateProfileFailure({ error: err.message||'Update failed' })))
      );
    })
  ));
}
