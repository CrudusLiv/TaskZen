import { createReducer, on } from '@ngrx/store';
import { NotificationsState, NotificationItem } from './notifications.models';
import { NotificationsActions } from './notifications.actions';

export const notificationsFeatureKey = 'notifications';

const initial: NotificationsState = { items: [], filter: 'all', panelOpen: false };

function seed(): NotificationItem[] {
  const now = (o: number)=> new Date(Date.now()-o).toISOString();
  return [
    { id: 'n1', kind: 'task', title: 'Task Created', description: 'Sample Task A created', createdAt: now(1000*60*5), read: false, targetId: 'c1' },
    { id: 'n2', kind: 'comment', title: 'New Comment', description: 'Comment on Sample Task B', createdAt: now(1000*60*30), read: false, targetId: 'c2' },
    { id: 'n3', kind: 'deadline', title: 'Upcoming Due Date', description: 'Sample Task B due tomorrow', createdAt: now(1000*60*60*2), read: true, targetId: 'c2' },
    { id: 'n4', kind: 'mention', title: 'You were mentioned', description: 'In discussion about Sample Task A', createdAt: now(1000*60*60*6), read: true, targetId: 'c1' }
  ];
}

export const notificationsReducer = createReducer(
  initial,
  on(NotificationsActions.initDemo, s => s.items.length ? s : { ...s, items: seed() }),
  on(NotificationsActions.addNotification, (s,{ item }) => ({ ...s, items: [item, ...s.items] })),
  on(NotificationsActions.markRead, (s,{ id }) => ({ ...s, items: s.items.map(i=> i.id===id ? { ...i, read: true }: i) })),
  on(NotificationsActions.markUnread, (s,{ id }) => ({ ...s, items: s.items.map(i=> i.id===id ? { ...i, read: false }: i) })),
  on(NotificationsActions.markAllRead, s => ({ ...s, items: s.items.map(i=> ({ ...i, read: true })) })),
  on(NotificationsActions.clearAll, s => ({ ...s, items: [] })),
  on(NotificationsActions.setFilter, (s,{ filter }) => ({ ...s, filter })),
  on(NotificationsActions.togglePanel, s => ({ ...s, panelOpen: !s.panelOpen })),
  on(NotificationsActions.openPanel, s => ({ ...s, panelOpen: true })),
  on(NotificationsActions.closePanel, s => ({ ...s, panelOpen: false }))
);
