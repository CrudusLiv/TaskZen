import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Store } from '@ngrx/store';
import { selectAuthLoading, selectAuthError, selectUser } from './state/auth.selectors';
import { AuthActions } from './state/auth.actions';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent {
  auth = inject(AuthService); // made public for template access
  private store = inject(Store);
  // local form signals
  mode = signal<'login' | 'signup'>('login');
  email = signal('');
  password = signal('');
  name = signal('');
  user$ = this.store.select(selectUser);
  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);
  editingProfile = signal(false);
  profileDraft = signal<{ name?: string; username?: string; bio?: string }>({});

  switchMode(m: 'login' | 'signup') {
    this.mode.set(m);
  }
  submit() {
    const email = this.email().trim();
    const password = this.password();
    if (!email || !password) return;
    if (this.mode() === 'login') this.auth.login(email, password);
    else this.auth.signup(email, password, this.name().trim() || undefined);
  }
  logout() {
    this.auth.logout();
  }
  startEdit(u: any) {
    this.editingProfile.set(true);
    this.profileDraft.set({ name: u.name, username: u.username, bio: u.bio });
  }
  saveProfile(u: any) {
    this.store.dispatch(AuthActions.updateProfile({ changes: this.profileDraft() } as any));
    this.editingProfile.set(false);
  }
  cancelProfile() {
    this.editingProfile.set(false);
  }
  googleLogin(){
    this.auth.loginWithGoogle();
  }
  ngOnInit() {
    this.auth.restore();
  }
}