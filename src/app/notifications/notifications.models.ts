export type NotificationKind = 'mention' | 'task' | 'comment' | 'deadline';

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  description?: string;
  createdAt: string; // ISO
  read: boolean;
  targetId?: string; // e.g., task/card id
}

export interface NotificationsState {
  items: NotificationItem[]; // newest first
  filter: NotificationKind | 'all';
  panelOpen: boolean;
}
