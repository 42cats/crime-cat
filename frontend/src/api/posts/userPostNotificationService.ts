// 새로운 구조화된 API로 리다이렉트
export { 
  basicNotificationService, 
  userPostNotificationService 
} from "@/api/notifications";

export type {
  BasicNotificationSettings,
  UserPostNotificationSettings,
  NotificationSettingsResponse,
  UserPostNotificationResponse,
} from "@/api/notifications";
