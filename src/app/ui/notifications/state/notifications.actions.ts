import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { NotificationKind, NotificationItem } from './notifications.models';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    'Init Demo': emptyProps(),
    'Add Notification': props<{ item: NotificationItem }>(),
    'Mark Read': props<{ id: string }>(),
    'Mark Unread': props<{ id: string }>(),
    'Mark All Read': emptyProps(),
    'Clear All': emptyProps(),
    'Set Filter': props<{ filter: NotificationKind | 'all' }>(),
    'Toggle Panel': emptyProps(),
    'Open Panel': emptyProps(),
    'Close Panel': emptyProps()
  }
});
