import { Component, Input, Output, EventEmitter, ViewChildren, ElementRef, QueryList, inject, effect, signal, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnChanges, AfterViewInit {
  private router = inject(Router);
  @Input() open = false;
  @Input() collapsed = false;
  @Output() close = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();
  @ViewChildren('navItem') navItems!: QueryList<ElementRef<HTMLAnchorElement>>;

  navLinks = [
    { path: '/boards', label: 'Boards', icon: '📋' },
    { path: '/kanban', label: 'Active Board', icon: '🗂️' },
    { path: '/activity', label: 'Activity', icon: '📰' },
    { path: '/focus', label: 'Focus', icon: '🎯' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/auth', label: 'Auth', icon: '👤', section: 'Account' }
  ];

  currentUrl = signal<string>(this.router.url || '/');

  constructor(){
    const sub = this.router.events.subscribe(()=>{
      // Slight delay to allow routerLinkActive to update
      queueMicrotask(()=> this.currentUrl.set(this.router.url || '/'));
    });
    effect(()=>{ // persist collapsed
      try { localStorage.setItem('nav:collapsed', this.collapsed ? '1':'0'); } catch {}
    });
  }

  ngAfterViewInit(){
    // focus first item if opened on mobile initially
    if(this.open && this.isMobile()){
      queueMicrotask(()=> this.focusFirst());
    }
  }

  ngOnChanges(ch: SimpleChanges){
    if(ch['open'] && !ch['open'].firstChange){
      if(this.open && this.isMobile()){
        // delay to allow panel slide in
        setTimeout(()=> this.focusFirst(), 120);
      }
    }
  }

  isActive(path: string){
    const cur = this.currentUrl();
    if(path==='/' || path.split('/').filter(Boolean).length===1){
      return cur === path;
    }
    return cur.startsWith(path);
  }

  handleClick(){ if(this.isMobile()){ this.navigate.emit(); } }

  onNavKey(e: KeyboardEvent){
    const items = this.navItems?.toArray().map(r=>r.nativeElement) || [];
    if(!items.length) return;
    const idx = items.findIndex(el=> el === document.activeElement);
    if(e.key==='ArrowDown'){ e.preventDefault(); items[(idx+1+items.length)%items.length].focus(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); items[(idx-1+items.length)%items.length].focus(); }
    else if(e.key==='Home'){ e.preventDefault(); items[0].focus(); }
    else if(e.key==='End'){ e.preventDefault(); items[items.length-1].focus(); }
    else if(e.key==='Escape' && this.isMobile()){ this.close.emit(); }
  }

  isMobile(){ return window.matchMedia('(max-width: 1024px)').matches; }
  private focusFirst(){
    const first = this.navItems?.first?.nativeElement; if(first){ first.focus(); }
  }
}
