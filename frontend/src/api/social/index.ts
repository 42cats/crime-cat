// 백엔드 API에 맞춘 통합 export
export { notificationService } from './notificationService';
export type { 
  AlarmType, 
  NotificationSettingsResponse, 
  NotificationSettingsRequest 
} from './notificationService';

// 기존 파일들은 deprecated로 표시 (호환성 유지)
export { basicNotificationService } from './basicNotificationService';
export { userPostNotificationService } from './userPostNotificationService';
