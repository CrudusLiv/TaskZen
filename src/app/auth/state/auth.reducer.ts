import { createReducer } from '@ngrx/store';

export const authFeatureKey = 'auth';

export interface AuthState { user: { id: string; name: string } | null; }
const initial: AuthState = { user: null };

export const authReducer = createReducer(initial);
