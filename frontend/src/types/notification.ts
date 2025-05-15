export enum NotificationType {
  GAME_RECORD_REQUEST = 'GAME_RECORD_REQUEST',
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  COMMENT = 'COMMENT',
  SYSTEM_NOTICE = 'SYSTEM_NOTICE',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read: boolean;
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
