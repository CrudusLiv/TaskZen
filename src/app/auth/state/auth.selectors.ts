import { createFeatureSelector } from '@ngrx/store';
import { authFeatureKey, AuthState } from './auth.reducer';
export const selectAuthState = createFeatureSelector<AuthState>(authFeatureKey);
