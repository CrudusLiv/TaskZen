import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectFilteredNotifications, selectFilter } from './notifications.selectors';
import { NotificationsActions } from './notifications.actions';

const FILTERS: { key: any; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mention', label: 'Mentions' },
  { key: 'task', label: 'Task Updates' },
  { key: 'comment', label: 'Comments' },
  { key: 'deadline', label: 'Deadlines' }
];

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss']
})
export class ActivityFeedComponent {
  private store = inject(Store);
  notifications$ = this.store.select(selectFilteredNotifications);
  filter$ = this.store.select(selectFilter);
  filters = FILTERS;
  ngOnInit(){ this.store.dispatch(NotificationsActions.initDemo()); }
  setFilter(f: any){ this.store.dispatch(NotificationsActions.setFilter({ filter: f })); }
  markAll(){ this.store.dispatch(NotificationsActions.markAllRead()); }
  clearAll(){ if(confirm('Clear all notifications?')) this.store.dispatch(NotificationsActions.clearAll()); }
  icon(kind: string){ return kind==='mention'? '@' : kind==='task' ? '📌' : kind==='comment' ? '💬' : kind==='deadline' ? '⏰' : '•'; }
  toggle(n: any){ this.store.dispatch((n.read? NotificationsActions.markUnread({ id: n.id }) : NotificationsActions.markRead({ id: n.id }))); }
}
