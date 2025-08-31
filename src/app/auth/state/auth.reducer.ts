import { createReducer, on } from '@ngrx/store';
import { AuthActions, UserProfile } from './auth.actions';

export const authFeatureKey = 'auth';

export interface AuthState { user: UserProfile | null; token: string | null; loading: boolean; error?: string | null; }
const initial: AuthState = { user: null, token: null, loading: false, error: null };

export const authReducer = createReducer(initial,
	on(AuthActions.restoreSession, AuthActions.login, AuthActions.signup, state => ({ ...state, loading: true, error: null })),
	on(AuthActions.loginWithProvider, state => ({ ...state, loading: true, error: null })),
	on(AuthActions.loginSuccess, AuthActions.signupSuccess, (state,{ user, token }) => ({ ...state, user, token, loading: false })),
	on(AuthActions.loginWithProviderSuccess, (state,{ user, token }) => ({ ...state, user, token, loading: false })),
	on(AuthActions.loginFailure, AuthActions.signupFailure, (state,{ error }) => ({ ...state, error, loading: false })),
	on(AuthActions.loginWithProviderFailure, (state,{ error }) => ({ ...state, error, loading: false })),
	on(AuthActions.logout, state => ({ ...state, loading: true })),
	on(AuthActions.logoutSuccess, state => ({ ...state, user: null, token: null, loading: false })),
	on(AuthActions.updateProfileSuccess, (state,{ user }) => ({ ...state, user })),
	on(AuthActions.updateProfileFailure, (state,{ error }) => ({ ...state, error })),
	on(AuthActions.setToken, (state,{ token }) => ({ ...state, token }))
);
