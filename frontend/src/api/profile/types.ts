/**
 * 프로필 관련 타입 정의
 */

export interface SocialLinks {
  instagram?: string;
  x?: string; // 트위터/X
  openkakao?: string; // 디스코드 또는 카카오톡
}

export interface UserProfile {
  id: string;
  nickname: string;
  bio?: string;
  badge?: string;
  avatar?: string; // 프로필 이미지 URL
  social_links?: SocialLinks;
  notification_settings?: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  discord: boolean;
}

export interface ProfileUpdateParams {
  nickname?: string;
  bio?: string;
  badge?: string;
  social_links?: SocialLinks;
  avatar?: File;
}

export interface BadgeItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface NicknameCheckResponse {
  isAvailable: boolean;
  message?: string;
}
