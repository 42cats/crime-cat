// 프로필 관련 컴포넌트들 통합 export
export { ProfileCard } from './ProfileCard';
export { ProfileInfo } from './ProfileInfo';
export { ProfileStats } from './ProfileStats';
export { SocialLinksSection } from './SocialLinks';
export { NotificationSettingsSection } from './NotificationSettings';

// 타입들도 함께 export
export type {
  UserProfile,
  NotificationSettings,
  SocialLinks,
  UserPostNotificationSettings,
  BasicNotificationSettings,
} from '@/types/profile';
