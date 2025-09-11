import { createActionGroup, props, emptyProps } from '@ngrx/store';

export interface UserProfile {
  id: string; email: string; name: string; username?: string; avatarUrl?: string; bio?: string; roles: string[]; createdAt: string; updatedAt: string;
}

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Init': emptyProps(),
    'Restore Session': emptyProps(),
    'Signup': props<{ email: string; password: string; name?: string }>(),
    'Signup Success': props<{ user: UserProfile; token: string }>(),
    'Signup Failure': props<{ error: string }>(),
    'Login': props<{ email: string; password: string }>(),
    'Login Success': props<{ user: UserProfile; token: string }>(),
    'Login Failure': props<{ error: string }>(),
  'Login With Provider': props<{ provider: 'google' | 'github' }>(),
  'Login With Provider Success': props<{ user: UserProfile; token: string; provider: string }>(),
  'Login With Provider Failure': props<{ error: string; provider: string }>(),
    'Logout': emptyProps(),
    'Logout Success': emptyProps(),
    'Update Profile': props<{ changes: Partial<Pick<UserProfile,'name'|'username'|'avatarUrl'|'bio'>> }>(),
    'Update Profile Success': props<{ user: UserProfile }>(),
    'Update Profile Failure': props<{ error: string }>(),
    'Set Token': props<{ token: string | null }>()
  }
});
