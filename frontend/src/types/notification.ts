export enum NotificationType {
  GAME_RECORD_REQUEST = 'GAME_RECORD_REQUEST',
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  COMMENT_ALERT = 'COMMENT_ALERT',
  SYSTEM_NOTICE = 'SYSTEM_NOTICE',
  NEW_THEME = 'NEW_THEME',
  GAME_NOTICE = 'GAME_NOTICE',
  USER_POST_NEW = 'USER_POST_NEW',
  USER_POST_COMMENT = 'USER_POST_COMMENT',
  USER_POST_COMMENT_REPLY = 'USER_POST_COMMENT_REPLY',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  PROCESSED = 'PROCESSED',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  expiresAt?: string;
  senderId?: string;
  senderName?: string;
  metadata?: Record<string, any>;
  // 하위 호환성을 위한 필드들
  userId?: string;
  read?: boolean;
  updatedAt?: string;
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
