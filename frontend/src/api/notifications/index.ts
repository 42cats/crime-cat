// 통합 export
export { basicNotificationService } from './basicNotificationService';
export { userPostNotificationService } from './userPostNotificationService';

// 타입들도 함께 export
export type {
  BasicNotificationSettings,
  UserPostNotificationSettings,
  NotificationSettingsResponse,
  UserPostNotificationResponse,
} from '@/types/profile';
