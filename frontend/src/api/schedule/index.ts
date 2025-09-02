// 일정 관리 API 서비스 통합 export

// 서비스 인스턴스를 먼저 import
import { scheduleService } from './scheduleService';
import { schedulePublicService } from './schedulePublicService';

// 서비스 인스턴스
export { scheduleService } from './scheduleService';
export { schedulePublicService } from './schedulePublicService';

// 서비스 클래스
export { ScheduleService } from './scheduleService';
export { SchedulePublicService } from './schedulePublicService';

// 타입 정의
export type {
  EventResponse,
  PublicEventResponse,
  EventCreateRequest,
  UserCalendarRequest,
  EventParticipant,
  AvailabilityTimeSlot,
  ApiResponse,
  PagedResponse,
  EventFilters,
  ApiError,
  EventUser,
} from './types';

// 열거형
export {
  EventStatus,
  EventCategory,
} from './types';

// 기본 export (편의성)
export default {
  auth: scheduleService,
  public: schedulePublicService,
};