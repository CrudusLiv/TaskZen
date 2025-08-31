import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthActions } from './state/auth.actions';
// Future: integrate Firebase auth providers
import { selectUser, selectIsAuthed, selectRoles } from './state/auth.selectors';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private store = inject(Store);
  user$ = this.store.select(selectUser);
  authed$ = this.store.select(selectIsAuthed);
  roles$ = this.store.select(selectRoles);

  login(email: string, password: string){ this.store.dispatch(AuthActions.login({ email, password })); }
  signup(email: string, password: string, name?: string){ this.store.dispatch(AuthActions.signup({ email, password, name })); }
  loginWithGoogle(){ this.store.dispatch(AuthActions.loginWithProvider({ provider: 'google' })); }
  logout(){ this.store.dispatch(AuthActions.logout()); }
  restore(){ this.store.dispatch(AuthActions.restoreSession()); }
}
