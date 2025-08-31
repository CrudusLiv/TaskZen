import { Component, signal, inject, computed, DestroyRef, effect } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { SideNavComponent } from './navigation/side-nav.component';
import { ToastContainerComponent } from './ui/toast-container.component';
import { Store } from '@ngrx/store';
import { AuthActions } from './auth/state/auth.actions';
import { NotificationBellComponent } from './notifications/notification-bell.component';
import { ThemeService } from './theme/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf, NgFor, NotificationBellComponent, SideNavComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  private theme = inject(ThemeService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  protected readonly title = signal('TaskZen');
  sidebarOpen = signal(false);
  sidebarCollapsed = signal(false); // desktop collapse (mini) state
  // mode removed (dark only)
  private currentUrl = signal<string>(this.router.url || '/');
  breadcrumbs = computed(()=> this.buildCrumbs(this.currentUrl()));

  constructor(){
    // Kick off auth restore (Firebase auth state listener in effects will respond)
    try { inject(Store).dispatch(AuthActions.restoreSession()); } catch {}
    const sub = this.router.events.subscribe(ev=>{
      if(ev instanceof NavigationEnd){ this.currentUrl.set(ev.urlAfterRedirects || ev.url); }
    });
    this.destroyRef.onDestroy(()=> sub.unsubscribe());
  try { const pref = localStorage.getItem('nav:collapsed'); if(pref==='1') this.sidebarCollapsed.set(true); } catch {}
  effect(()=>{ try { localStorage.setItem('nav:collapsed', this.sidebarCollapsed() ? '1':'0'); } catch {} });
  }

  toggleSidebar(){
    const mobile = window.matchMedia('(max-width: 1024px)').matches;
    if(mobile){
      this.sidebarOpen.update(v=>!v);
    } else {
      this.toggleCollapse();
    }
  }
  closeSidebar(){ this.sidebarOpen.set(false); }
  toggleCollapse(){ this.sidebarCollapsed.update(v=>!v); }
  // toggleTheme removed (dark only)
  setAccent(c: string){ this.theme.setAccent(c); }
  closeSidebarOnMobile(){ if(window.matchMedia('(max-width: 1024px)').matches) this.closeSidebar(); }

  private buildCrumbs(url: string){
    if(!url || url==='/' ) return [] as {label:string; url?:string}[];
    const parts = url.split('?')[0].split('#')[0].split('/').filter(Boolean);
    const acc: {label:string; url?:string}[] = [];
    parts.forEach((p,i)=>{
      const path = '/' + parts.slice(0,i+1).join('/');
      const isLast = i===parts.length-1;
      acc.push({ label: this.formatLabel(p), url: isLast? undefined : path });
    });
    return acc;
  }
  private formatLabel(seg: string){
    const clean = decodeURIComponent(seg).replace(/[-_]/g,' ');
    return clean.charAt(0).toUpperCase()+clean.slice(1);
  }
}
