import { createFeatureSelector, createSelector } from '@ngrx/store';
import { notificationsFeatureKey } from './notifications.reducer';
import { NotificationsState } from './notifications.models';

export const selectNotificationsState = createFeatureSelector<NotificationsState>(notificationsFeatureKey);
export const selectAllNotifications = createSelector(selectNotificationsState, s => s.items);
export const selectUnreadCount = createSelector(selectAllNotifications, items => items.filter(i=>!i.read).length);
export const selectFilter = createSelector(selectNotificationsState, s => s.filter);
export const selectPanelOpen = createSelector(selectNotificationsState, s => s.panelOpen);
export const selectFilteredNotifications = createSelector(
  selectAllNotifications,
  selectFilter,
  (items, filter) => filter==='all' ? items : items.filter(i=>i.kind===filter)
);
