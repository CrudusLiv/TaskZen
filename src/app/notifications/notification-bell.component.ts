import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { NotificationsActions } from './notifications.actions';
import { selectUnreadCount, selectPanelOpen, selectAllNotifications } from './notifications.selectors';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="bell-wrapper" (click)="toggle()" [class.open]="(panelOpen$ | async)">
    <span class="icon">🔔</span>
    <span class="badge" *ngIf="(unread$ | async) as c" [class.hide]="!c">{{ c }}</span>
  </div>
  <div class="panel" *ngIf="(panelOpen$ | async)">
    <div class="panel-header">
      <span>Notifications</span>
      <button (click)="markAll($event)">Mark all read</button>
      <button (click)="clear($event)" class="danger">Clear</button>
    </div>
    <div class="items" *ngIf="(items$ | async) as items">
      <div class="empty" *ngIf="!items.length">No notifications</div>
      <div class="notif" *ngFor="let n of items" [class.unread]="!n.read" (click)="toggleRead(n,$event)">
        <span class="kind" [title]="n.kind">{{ icon(n.kind) }}</span>
        <div class="body">
          <div class="title">{{ n.title }}</div>
          <div class="desc" *ngIf="n.description">{{ n.description }}</div>
          <div class="time">{{ n.createdAt | date:'short' }}</div>
        </div>
      </div>
    </div>
    <a routerLink="/activity" class="view-all" (click)="close()">View all →</a>
  </div>
  `,
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent {
  private store = inject(Store);
  unread$ = this.store.select(selectUnreadCount);
  panelOpen$ = this.store.select(selectPanelOpen);
  items$ = this.store.select(selectAllNotifications);
  ngOnInit(){ this.store.dispatch(NotificationsActions.initDemo()); }
  toggle(){ this.store.dispatch(NotificationsActions.togglePanel()); }
  close(){ this.store.dispatch(NotificationsActions.closePanel()); }
  markAll(e: Event){ e.stopPropagation(); this.store.dispatch(NotificationsActions.markAllRead()); }
  clear(e: Event){ e.stopPropagation(); if(confirm('Clear all notifications?')) this.store.dispatch(NotificationsActions.clearAll()); }
  toggleRead(n: any, e: Event){ e.stopPropagation(); this.store.dispatch((n.read? NotificationsActions.markUnread({ id: n.id }) : NotificationsActions.markRead({ id: n.id }))); }
  icon(kind: string){ return kind==='mention'? '@' : kind==='task' ? '📌' : kind==='comment' ? '💬' : kind==='deadline' ? '⏰' : '•'; }
  @HostListener('document:click',['$event']) outside(e: Event){ if(!(e.target as HTMLElement).closest('.bell-wrapper,.panel')) this.store.dispatch(NotificationsActions.closePanel()); }
}
