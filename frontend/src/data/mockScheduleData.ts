import { EventResponse, PublicEventResponse, EventStatus, EventCategory } from '@/api/schedule/types';
import { addDays, addHours, subDays, subHours } from 'date-fns';

// 더미 사용자 데이터
export const mockUsers = [
  { id: '1', nickname: '미스터리마니아', name: '김일정' },
  { id: '2', nickname: '추리게임러버', name: '이참여' },
  { id: '3', nickname: '방탈출마스터', name: '박생성' },
  { id: '4', nickname: '범죄수사관', name: '최관리' },
  { id: '5', nickname: '셜록홈즈', name: '정탐정' },
];

// 더미 일정 데이터 생성 함수
const generateMockEvent = (
  id: string,
  title: string,
  description: string,
  category: EventCategory,
  status: EventStatus,
  creatorIdx: number = 0,
  maxParticipants?: number,
  scheduledOffset?: number
): EventResponse => {
  const creator = mockUsers[creatorIdx];
  const baseDate = new Date();
  
  return {
    id,
    title,
    description,
    category,
    status,
    maxParticipants,
    scheduledAt: scheduledOffset ? addDays(addHours(baseDate, scheduledOffset % 24), Math.floor(scheduledOffset / 24)).toISOString() : undefined,
    createdAt: subDays(baseDate, Math.random() * 30).toISOString(),
    creatorName: creator.name,
  };
};

// 모집 중인 일정 더미 데이터
export const mockRecruitingEvents: EventResponse[] = [
  generateMockEvent(
    '1',
    '🔍 온라인 추리 게임 모임',
    '매주 금요일 밤 온라인으로 모여서 추리 게임을 하는 정기 모임입니다. 초보자도 환영!',
    EventCategory.GAMING,
    EventStatus.RECRUITING,
    0,
    8,
    19 // 내일 저녁 7시
  ),
  generateMockEvent(
    '2',
    '📚 미스터리 소설 북클럽',
    '이달의 추천 미스터리 소설을 함께 읽고 토론하는 모임입니다. 이번 달은 아가사 크리스티 작품!',
    EventCategory.STUDY,
    EventStatus.RECRUITING,
    1,
    12,
    144 // 6일 후 12시
  ),
  generateMockEvent(
    '3',
    '🏃‍♂️ 강남 방탈출 투어',
    '강남 지역 유명 방탈출 카페를 하루 종일 돌아다니는 이벤트입니다. 점심과 간식 제공!',
    EventCategory.SOCIAL,
    EventStatus.RECRUITING,
    2,
    6,
    216 // 9일 후 12시
  ),
  generateMockEvent(
    '4',
    '💻 범죄수사 시뮬레이션 워크샵',
    '실제 사건을 바탕으로 한 디지털 수사 기법을 배우는 워크샵입니다. 전문가 강연 포함.',
    EventCategory.WORKSHOP,
    EventStatus.RECRUITING,
    3,
    15,
    72 // 3일 후 12시
  ),
  generateMockEvent(
    '5',
    '🎭 추리극 공연 관람',
    '대학로에서 열리는 추리극 공연을 함께 관람하고 후기를 나누는 모임입니다.',
    EventCategory.SOCIAL,
    EventStatus.RECRUITING,
    4,
    10,
    168 // 7일 후 12시
  ),
  generateMockEvent(
    '6',
    '☕ 추리 소설 작가와의 만남',
    '유명 추리소설 작가님과 함께하는 토크쇼 및 사인회입니다. 질의응답 시간도 마련!',
    EventCategory.MEETING,
    EventStatus.RECRUITING,
    0,
    20,
    336 // 14일 후 12시
  ),
];

// 참여 중인 일정 더미 데이터
export const mockMyEvents: EventResponse[] = [
  generateMockEvent(
    '7',
    '🕵️ 정기 추리 모임 3월',
    '매월 첫째 주 토요일에 진행되는 정기 추리 모임입니다.',
    EventCategory.MEETING,
    EventStatus.RECRUITMENT_COMPLETE,
    1,
    12,
    48 // 2일 후 12시
  ),
  generateMockEvent(
    '8',
    '🧩 온라인 퍼즐 대회',
    'Crime-Cat 커뮤니티 회원들과 함께하는 온라인 퍼즐 대회입니다.',
    EventCategory.GAMING,
    EventStatus.RECRUITMENT_COMPLETE,
    2,
    16,
    120 // 5일 후 12시
  ),
  generateMockEvent(
    '9',
    '📖 추리소설 독서 챌린지',
    '3월 한 달 동안 추리소설 5권 읽기 챌린지입니다.',
    EventCategory.STUDY,
    EventStatus.RECRUITING,
    3,
    30,
    192 // 8일 후 12시
  ),
];

// 내가 만든 일정 더미 데이터
export const mockCreatedEvents: EventResponse[] = [
  generateMockEvent(
    '10',
    '🎯 신입 회원 환영 모임',
    '새로 가입한 회원들을 위한 환영 모임입니다. 서로 인사하고 친해져요!',
    EventCategory.SOCIAL,
    EventStatus.RECRUITING,
    0,
    15,
    96 // 4일 후 12시
  ),
  generateMockEvent(
    '11',
    '🏆 추리 퀴즈 대회',
    '추리와 관련된 다양한 퀴즈로 구성된 재미있는 대회입니다. 상품도 있어요!',
    EventCategory.GAMING,
    EventStatus.RECRUITMENT_COMPLETE,
    0,
    20,
    264 // 11일 후 12시
  ),
];

// 완료된 일정 더미 데이터
export const mockCompletedEvents: EventResponse[] = [
  generateMockEvent(
    '12',
    '🎬 명탐정 코난 영화 관람',
    '최신 명탐정 코난 극장판을 함께 관람했습니다.',
    EventCategory.SOCIAL,
    EventStatus.COMPLETED,
    1,
    8,
    -48 // 2일 전
  ),
  generateMockEvent(
    '13',
    '📚 셜록 홈즈 전집 완독 모임',
    '셜록 홈즈 전집을 완독하고 감상을 나누는 모임이었습니다.',
    EventCategory.STUDY,
    EventStatus.COMPLETED,
    2,
    10,
    -168 // 7일 전
  ),
  generateMockEvent(
    '14',
    '🔬 과학수사 체험 워크샵',
    '실제 과학수사 기법을 체험해볼 수 있는 워크샵이었습니다.',
    EventCategory.WORKSHOP,
    EventStatus.COMPLETED,
    3,
    12,
    -336 // 14일 전
  ),
];

// 취소된 일정 더미 데이터
export const mockCancelledEvents: EventResponse[] = [
  generateMockEvent(
    '15',
    '❌ 야외 미스터리 게임 (취소)',
    '날씨 문제로 인해 취소된 야외 미스터리 게임입니다.',
    EventCategory.GAMING,
    EventStatus.CANCELLED,
    4,
    6,
    -24 // 1일 전
  ),
];

// 전체 일정 더미 데이터
export const mockAllEvents: EventResponse[] = [
  ...mockRecruitingEvents,
  ...mockMyEvents,
  ...mockCreatedEvents,
  ...mockCompletedEvents,
  ...mockCancelledEvents,
];

// 퍼블릭 이벤트로 변환하는 함수
export const convertToPublicEvent = (event: EventResponse): PublicEventResponse => ({
  id: event.id,
  title: event.title,
  description: event.description,
  category: event.category,
  status: event.status,
  maxParticipants: event.maxParticipants,
  scheduledAt: event.scheduledAt,
  createdAt: event.createdAt,
  creatorNickname: mockUsers.find(user => user.name === event.creatorName)?.nickname || '알 수 없음',
});

export const mockAllPublicEvents: PublicEventResponse[] = mockAllEvents.map(convertToPublicEvent);

// 참여자 수 더미 데이터
export const mockParticipantCounts: Record<string, number> = {
  '1': 5,
  '2': 8,
  '3': 4,
  '4': 12,
  '5': 7,
  '6': 15,
  '7': 10,
  '8': 14,
  '9': 22,
  '10': 9,
  '11': 18,
  '12': 6,
  '13': 8,
  '14': 11,
  '15': 0,
};

// 카테고리별 필터링 함수
export const getEventsByCategory = (category?: string) => {
  if (!category || category === 'ALL') return mockAllEvents;
  return mockAllEvents.filter(event => event.category === category);
};

// 상태별 필터링 함수
export const getEventsByStatus = (status?: EventStatus) => {
  if (!status) return mockAllEvents;
  return mockAllEvents.filter(event => event.status === status);
};

// 검색 함수
export const searchEvents = (query: string) => {
  if (!query) return mockAllEvents;
  const lowerQuery = query.toLowerCase();
  return mockAllEvents.filter(event => 
    event.title.toLowerCase().includes(lowerQuery) ||
    event.description?.toLowerCase().includes(lowerQuery)
  );
};

// 정렬 함수
export type SortOption = 'latest' | 'oldest' | 'title' | 'category' | 'participants';

export const sortEvents = (events: EventResponse[], sortBy: SortOption): EventResponse[] => {
  const sorted = [...events];
  
  switch (sortBy) {
    case 'latest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'category':
      return sorted.sort((a, b) => a.category.localeCompare(b.category));
    case 'participants':
      return sorted.sort((a, b) => (mockParticipantCounts[b.id] || 0) - (mockParticipantCounts[a.id] || 0));
    default:
      return sorted;
  }
};