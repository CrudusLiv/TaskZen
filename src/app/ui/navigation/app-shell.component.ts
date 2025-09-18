import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgFor } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectCalmMode } from '../preferences/state/preferences.selectors';
import { PreferencesActions } from '../preferences/state/preferences.actions';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, NgFor],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent {
  nav: NavLink[] = [
    { label: 'Capture', path: '' },
    { label: 'Items', path: 'items' },
    { label: 'Focus', path: 'focus' },
    { label: 'Energy', path: 'energy' },
    { label: 'Routines', path: 'routines' },
    { label: 'Coach', path: 'coach' },
    { label: 'Insights', path: 'insights' },
    { label: 'Settings', path: 'settings' },
  ];
  private store = inject(Store);
  sidebarOpen = signal(false);
  calmMode = this.store.selectSignal(selectCalmMode);
  toggle() {
    this.sidebarOpen.update((v) => !v);
  }
  toggleCalm() {
    this.store.dispatch(PreferencesActions.toggleCalmMode());
  }
}
