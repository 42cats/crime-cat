export enum NotificationType {
  GAME_RECORD_REQUEST = 'GAME_RECORD_REQUEST',
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  COMMENT_ALERT = 'COMMENT_ALERT',
  SYSTEM_NOTICE = 'SYSTEM_NOTICE',
  NEW_THEME = 'NEW_THEME',
  GAME_NOTICE = 'GAME_NOTICE',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  PROCESSED = 'PROCESSED',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read: boolean;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface UnreadCountResponse {
  count: number;
}
