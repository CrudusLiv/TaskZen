import { Component, signal, inject, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgFor } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectCalmMode } from '../preferences/state/preferences.selectors';
import { PreferencesActions } from '../preferences/state/preferences.actions';
import { ErrorNotificationBannerComponent } from '../../core/error/error-notification-banner.component';

interface NavLink {
  label: string;
  path: string;
  icon: string;
}

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, ErrorNotificationBannerComponent],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent {
  nav: NavLink[] = [
    { label: 'Capture', path: '', icon: 'M5 12h14M5 6h14M5 18h8' },
    { label: 'Items', path: 'items', icon: 'M4 6h16M4 12h16M4 18h10' },
    { label: 'Prioritize', path: 'prioritize', icon: 'M12 3l7 7-7 11-7-11 7-7z' },
    { label: 'Focus', path: 'focus', icon: 'M12 5a7 7 0 1 1 0 14 7 7 0 0 0 0-14z' },
    { label: 'Energy', path: 'energy', icon: 'M13 2 6 14h5l-1 8 7-12h-5l1-8z' },
    { label: 'Routines', path: 'routines', icon: 'M6 4h12v4H6zM6 10h12v4H6zM6 16h12v4H6z' },
    { label: 'Coach', path: 'coach', icon: 'M4 19v-6l8-4 8 4v6l-8-4-8 4z' },
    { label: 'Insights', path: 'insights', icon: 'M5 13l4-4 4 4 6-6v8H5z' },
    {
      label: 'Settings',
      path: 'settings',
      icon: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M4 12l2.2-.4a5.8 5.8 0 0 1 .8-1.9L6 8l2-2 .7 1.1c.6-.3 1.2-.5 1.9-.6L11 4h2l.4 2.2c.7.1 1.3.3 1.9.6L16 6l2 2-.9 1.7c.4.6.6 1.2.8 1.9L20 12l-2.2.4c-.1.7-.3 1.3-.6 1.9L18 16l-2 2-1.7-.9c-.6.4-1.2.6-1.9.8L13 20h-2l-.4-2.2a5.8 5.8 0 0 1-1.9-.8L8 18l-2 2-.9-1.7c-.3-.6-.5-1.2-.6-1.9L4 13v-1z',
    },
  ];
  private store = inject(Store);
  private router = inject(Router);
  sidebarOpen = signal(false);
  collapsed = signal(false);
  calmMode = this.store.selectSignal(selectCalmMode);
  currentUrl = signal(this.router.url);
  activeIndex = computed(() => {
    const url = this.currentUrl();
    const clean = url.startsWith('/') ? url.substring(1) : url;
    const seg = clean.split('?')[0].split('#')[0];
    const first = seg.split('/')[0];
    const match = this.nav.findIndex(
      (l) => (l.path === '' && (first === '' || first === '')) || l.path === first
    );
    return match < 0 ? 0 : match;
  });
  itemHeight = 40;
  gap = 6;
  topOffset = 0; // used in template for indicator positioning
  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe(() => this.currentUrl.set(this.router.url));
  }
  toggle() {
    this.sidebarOpen.update((v) => !v);
  }
  toggleCollapse() {
    this.collapsed.update((v) => !v);
  }
  toggleCalm() {
    this.store.dispatch(PreferencesActions.toggleCalmMode());
  }
}
