import { createFeatureSelector, createSelector } from '@ngrx/store';
import { notificationsFeatureKey } from './notifications.reducer';
import { NotificationsState } from './notifications.models';

export const selectNotificationsState = createFeatureSelector<NotificationsState | undefined>(
  notificationsFeatureKey
);
const safe = <T>(val: T | undefined, fallback: T): T => (val === undefined ? fallback : val);
export const selectAllNotifications = createSelector(selectNotificationsState, (s) =>
  safe(s?.items, [] as any)
);
export const selectUnreadCount = createSelector(
  selectAllNotifications,
  (items: any[]) => items.filter((i: any) => !i.read).length
);
export const selectFilter = createSelector(selectNotificationsState, (s) => safe(s?.filter, 'all'));
export const selectPanelOpen = createSelector(selectNotificationsState, (s) =>
  safe(s?.panelOpen, false)
);
export const selectFilteredNotifications = createSelector(
  selectAllNotifications,
  selectFilter,
  (items: any[], filter: string) =>
    filter === 'all' ? items : items.filter((i: any) => i.kind === filter)
);
