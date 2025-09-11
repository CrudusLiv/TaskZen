import { createFeatureSelector, createSelector } from '@ngrx/store';
import { authFeatureKey, AuthState } from './auth.reducer';
export const selectAuthState = createFeatureSelector<AuthState>(authFeatureKey);
export const selectUser = createSelector(selectAuthState, s=> s.user);
export const selectIsAuthed = createSelector(selectUser, u=> !!u);
export const selectRoles = createSelector(selectUser, u=> u?.roles || []);
export const selectHasRole = (role: string) => createSelector(selectRoles, r=> r.includes(role));
export const selectAuthLoading = createSelector(selectAuthState, s=> s.loading);
export const selectAuthError = createSelector(selectAuthState, s=> s.error);
