// 백엔드 응답 구조에 맞는 타입 정의
export interface NotificationSettings {
  email: boolean;
  discord: boolean;
}

export interface SocialLinks {
  instagram?: string;
  x?: string;
  openkakao?: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  profile_image_path?: string;
  notificationSettings?: NotificationSettings;
  social_links?: SocialLinks;
  bio?: string;
  title?: string;
  badge?: string;
  snowflake?: string;
  last_login_at?: string;
  point?: number;
}

export interface UserPostNotificationSettings {
  userPostNew: boolean;
  userPostComment: boolean;
  userPostCommentReply: boolean;
}

export interface BasicNotificationSettings {
  email: boolean;
  discord: boolean;
}

// API 응답 타입
export interface NotificationSettingsResponse {
  email: boolean;
  discord: boolean;
}

export interface UserPostNotificationResponse {
  userPostNew: boolean;
  userPostComment: boolean;
  userPostCommentReply: boolean;
}
