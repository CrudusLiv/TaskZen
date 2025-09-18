import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgFor } from '@angular/common';

interface NavLink { label: string; path: string; }

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, NgFor],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss']
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
    { label: 'Settings', path: 'settings' }
  ];
  sidebarOpen = signal(false);
  // TODO: wire to preferences store selector
  calmMode = signal(false);
  toggle(){ this.sidebarOpen.update(v=> !v); }
}
