/**
 * 커맨드 파라미터 자동완성 서비스
 * 기존 백엔드 API 구조에 맞게 수정됨
 */

import { 
  AutocompleteRequest, 
  AutocompleteResponse, 
  AutocompleteChoice,
  ParameterContext,
  EnhancedBotCommandParameter 
} from '../types/parameterAutocomplete';
import { apiClient } from '../lib/api';

// API 상수
const API_PREFIX = '/api/v1';

// 캐시 관리 (메모리 누수 방지)
const autocompleteCache = new Map<string, { data: AutocompleteChoice[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분
const MAX_CACHE_SIZE = 100; // 최대 캐시 항목 수
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10분마다 정리

/**
 * 캐시 키 생성
 */
function generateCacheKey(endpoint: string, guildId: string, query?: string): string {
  return `${endpoint}.${guildId}.${query || ''}`;
}

/**
 * 캐시에서 데이터 조회
 */
function getCachedData(cacheKey: string): AutocompleteChoice[] | null {
  const cached = autocompleteCache.get(cacheKey);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    autocompleteCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

/**
 * 만료된 캐시 항목 정리
 */
function cleanupExpiredCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, { timestamp }] of autocompleteCache.entries()) {
    if (now - timestamp > CACHE_DURATION) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => autocompleteCache.delete(key));
  
  if (keysToDelete.length > 0) {
    console.debug(`🧹 만료된 캐시 ${keysToDelete.length}개 정리 완료`);
  }
}

/**
 * 캐시 크기 제한 (LRU 방식)
 */
function enforceMaxCacheSize(): void {
  if (autocompleteCache.size <= MAX_CACHE_SIZE) return;
  
  // 가장 오래된 항목부터 제거
  const entries = Array.from(autocompleteCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  const itemsToRemove = entries.length - MAX_CACHE_SIZE;
  for (let i = 0; i < itemsToRemove; i++) {
    autocompleteCache.delete(entries[i][0]);
  }
  
  console.debug(`📦 캐시 크기 제한: ${itemsToRemove}개 항목 제거 (현재: ${autocompleteCache.size}/${MAX_CACHE_SIZE})`);
}

/**
 * 캐시에 데이터 저장 (크기 제한 적용)
 */
function setCachedData(cacheKey: string, data: AutocompleteChoice[]): void {
  autocompleteCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  // 캐시 크기 제한 적용
  enforceMaxCacheSize();
}

/**
 * 인증된 API 호출 (기존 apiClient 사용)
 */
async function fetchWithAuth<T = unknown>(endpoint: string): Promise<T> {
  try {
    // API_PREFIX 제거 (apiClient가 자동으로 추가)
    const cleanEndpoint = endpoint.startsWith(API_PREFIX) ? endpoint.substring(API_PREFIX.length) : endpoint;
    return await apiClient.get<T>(cleanEndpoint);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status: number } };
    if (axiosError.response?.status === 401) {
      console.error('인증 실패 - 로그인이 필요합니다');
      throw new Error('인증 실패 - 로그인이 필요합니다');
    } else if (axiosError.response?.status === 403) {
      console.error('권한 없음 - 길드 소유자만 접근 가능합니다');
      throw new Error('권한 없음 - 길드 소유자만 접근 가능합니다');
    }
    console.error('API 호출 실패:', error);
    throw error;
  }
}

/**
 * 파라미터 타입/이름별 API 엔드포인트 매핑
 */
function getApiEndpoint(parameter: EnhancedBotCommandParameter, context: ParameterContext, query?: string): string | null {
  const { guildId } = context;
  
  // 특정 파라미터명 기반 매핑 (AutocompleteController)
  switch (parameter.name) {
    case 'groupname':
    case 'groupnames':
      return `/api/v1/autocomplete/${guildId}/group-names${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    case '자동화_그룹':
      return `/api/v1/autocomplete/${guildId}/button-groups${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    case '파일명':
      return `/api/v1/autocomplete/${guildId}/log-files${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    default:
      // 타입별 기본 매핑 (WebGuildController)
      if (parameter.type === 'channel') return `/api/v1/auth/guilds/channels/${guildId}`;
      if (parameter.type === 'role') return `/api/v1/auth/guilds/roles/${guildId}`;
      return null;
  }
}

/**
 * 백엔드 DTO 타입 정의
 */
interface ChannelDto {
  id: string;
  name: string;
  type: number;
  typeKey: string;
  displayName: string;
  emoji: string;
  position: number;
  parentId?: string;
  topic?: string;
  nsfw?: boolean;
}

interface RoleDto {
  id: string;
  name: string;
  description?: string;
  permissions?: string;
  position: number;
  color: number;
  hoist: boolean;
  managed: boolean;
  mentionable: boolean;
  icon?: string;
  unicodeEmoji?: string;
  flags: number;
}

interface AutocompleteOptionDto {
  name: string;
  value: string;
}

/**
 * 백엔드 응답 데이터를 AutocompleteChoice 형식으로 변환
 */
function convertToAutocompleteChoice(data: unknown[], type: 'channel' | 'role' | 'autocomplete'): AutocompleteChoice[] {
  switch (type) {
    case 'channel':
      // ChannelDto -> AutocompleteChoice 변환
      return (data as ChannelDto[]).map(channel => ({
        name: `#${channel.name}`,
        value: channel.id,
        description: `${channel.emoji || (channel.typeKey === 'voice' ? '🔊' : '💬')} ${channel.displayName || channel.typeKey} 채널`,
        icon: channel.emoji || (channel.typeKey === 'voice' ? '🔊' : '💬'),
        disabled: false
      }));
      
    case 'role':
      // RoleDto -> AutocompleteChoice 변환
      return (data as RoleDto[]).map(role => ({
        name: role.name,
        value: role.id,
        description: `역할 • 위치: ${role.position}${role.managed ? ' (관리됨)' : ''}`,
        icon: '👥',
        disabled: role.managed || false
      }));
      
    case 'autocomplete':
      // AutocompleteOptionDto -> AutocompleteChoice 변환
      return (data as AutocompleteOptionDto[]).map(item => ({
        name: item.name,
        value: item.value,
        description: '',
        icon: ''
      }));
      
    default:
      return [];
  }
}

/**
 * 길드 역할 목록 조회 (새로운 API 사용)
 */
export async function fetchGuildRoles(guildId: string): Promise<AutocompleteChoice[]> {
  // 첫 사용 시 캐시 시스템 초기화
  initializeCache();
  
  const cacheKey = generateCacheKey('guild_roles', guildId);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const roles = await fetchWithAuth<RoleDto[]>(`/api/v1/auth/guilds/roles/${guildId}`);
    const choices = convertToAutocompleteChoice(roles, 'role');

    setCachedData(cacheKey, choices);
    return choices;
  } catch (error) {
    console.error('역할 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 길드 채널 목록 조회 (새로운 API 사용)
 */
export async function fetchGuildChannels(guildId: string, type?: string): Promise<AutocompleteChoice[]> {
  const cacheKey = generateCacheKey('guild_channels', guildId, type);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const channels = await fetchWithAuth<ChannelDto[]>(`/api/v1/auth/guilds/channels/${guildId}`);
    let filteredChannels = channels;
    
    if (type) {
      filteredChannels = channels.filter(ch => ch.typeKey === type);
    }

    const choices = convertToAutocompleteChoice(filteredChannels, 'channel');
    setCachedData(cacheKey, choices);
    return choices;
  } catch (error) {
    console.error('채널 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 자동화 그룹 목록 조회 (기존 API 사용 - AutocompleteController)
 */
export async function fetchAutomationGroups(guildId: string, query?: string): Promise<AutocompleteChoice[]> {
  const cacheKey = generateCacheKey('automation_groups', guildId, query);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `/api/v1/autocomplete/${guildId}/button-groups${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    const groups = await fetchWithAuth<AutocompleteOptionDto[]>(url);
    const choices = convertToAutocompleteChoice(groups, 'autocomplete');

    setCachedData(cacheKey, choices);
    return choices;
  } catch (error) {
    console.error('자동화 그룹 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 메시지 매크로 그룹 목록 조회 (AutocompleteController)
 */
export async function fetchMessageGroups(guildId: string, query?: string): Promise<AutocompleteChoice[]> {
  const cacheKey = generateCacheKey('message_groups', guildId, query);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `/api/v1/autocomplete/${guildId}/group-names${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    const groups = await fetchWithAuth<AutocompleteOptionDto[]>(url);
    const choices = convertToAutocompleteChoice(groups, 'autocomplete');

    setCachedData(cacheKey, choices);
    return choices;
  } catch (error) {
    console.error('메시지 그룹 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 로그 파일 목록 조회 (AutocompleteController)
 */
export async function fetchLogFiles(guildId: string, query?: string): Promise<AutocompleteChoice[]> {
  const cacheKey = generateCacheKey('log_files', guildId, query);
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `/api/v1/autocomplete/${guildId}/log-files${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    const files = await fetchWithAuth<AutocompleteOptionDto[]>(url);
    const choices = convertToAutocompleteChoice(files, 'autocomplete');

    setCachedData(cacheKey, choices);
    return choices;
  } catch (error) {
    console.error('로그 파일 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 동적 자동완성 데이터 조회 (새로운 백엔드 API 구조 사용)
 */
export async function fetchParameterChoices(request: AutocompleteRequest): Promise<AutocompleteResponse> {
  const { parameterName, query, context } = request;
  
  // 파라미터 객체 생성 (EnhancedBotCommandParameter 형식으로 변환)
  const parameter: EnhancedBotCommandParameter = {
    name: parameterName,
    type: 'string', // 기본값
    description: '',
    required: false
  };
  
  const endpoint = getApiEndpoint(parameter, context, query);
  
  if (!endpoint) {
    console.warn(`지원되지 않는 파라미터: ${parameterName}`);
    return {
      success: false,
      choices: [],
      error: `지원되지 않는 파라미터: ${parameterName}`
    };
  }
  
  const cacheKey = generateCacheKey(endpoint, context.guildId, query);
  const cached = getCachedData(cacheKey);
  
  if (cached) {
    return {
      success: true,
      choices: cached,
      total: cached.length
    };
  }

  try {
    
    let choices: AutocompleteChoice[] = [];
    
    // 파라미터 타입별 조회
    switch (parameterName) {
      case 'groupname':
      case 'groupnames':
        choices = await fetchMessageGroups(context.guildId, query);
        break;
      case '자동화_그룹':
        choices = await fetchAutomationGroups(context.guildId, query);
        break;
      case '파일명':
        choices = await fetchLogFiles(context.guildId, query);
        break;
      default:
        // 타입별 기본 처리
        if (parameter.type === 'channel') {
          choices = await fetchGuildChannels(context.guildId);
        } else if (parameter.type === 'role') {
          choices = await fetchGuildRoles(context.guildId);
        } else {
          throw new Error(`지원되지 않는 파라미터 타입: ${parameter.type}`);
        }
    }
    
    
    return {
      success: true,
      choices,
      total: choices.length
    };
    
  } catch (error) {
    console.error('파라미터 자동완성 조회 실패:', error);
    return {
      success: false,
      choices: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 파라미터 타입별 기본 자동완성 제공자 (새로운 API 사용)
 */
export const autocompleteProviders = {
  role: (context: ParameterContext) => fetchGuildRoles(context.guildId),
  channel: (context: ParameterContext) => fetchGuildChannels(context.guildId),
  voice_channel: (context: ParameterContext) => fetchGuildChannels(context.guildId, 'voice'),
  text_channel: (context: ParameterContext) => fetchGuildChannels(context.guildId, 'text'),
  automation_group: (context: ParameterContext) => fetchAutomationGroups(context.guildId),
  guild_roles: (context: ParameterContext) => fetchGuildRoles(context.guildId),
  guild_channels: (context: ParameterContext) => fetchGuildChannels(context.guildId),
  guild_members: (context: ParameterContext) => Promise.resolve([]), // TODO: 구현 필요
  message_groups: (context: ParameterContext) => fetchMessageGroups(context.guildId),
  log_files: (context: ParameterContext) => fetchLogFiles(context.guildId),
};

/**
 * 검색 필터링
 */
export function filterChoices(choices: AutocompleteChoice[], query: string): AutocompleteChoice[] {
  if (!query) return choices;
  
  const normalizedQuery = query.toLowerCase();
  return choices.filter(choice => 
    choice.name.toLowerCase().includes(normalizedQuery) ||
    choice.value.toLowerCase().includes(normalizedQuery) ||
    (choice.description && choice.description.toLowerCase().includes(normalizedQuery))
  );
}

// 자동 캐시 정리 타이머 설정
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * 자동 캐시 정리 시작
 */
function startAutomaticCleanup(): void {
  if (cleanupTimer) return; // 이미 실행 중
  
  cleanupTimer = setInterval(() => {
    cleanupExpiredCache();
  }, CLEANUP_INTERVAL);
  
  console.debug('🕒 자동 캐시 정리 타이머 시작 (10분 간격)');
}

/**
 * 자동 캐시 정리 중지
 */
function stopAutomaticCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.debug('⏹️ 자동 캐시 정리 타이머 중지');
  }
}

/**
 * 캐시 초기화 및 정리 시스템 관리
 */
export function clearAutocompleteCache(): void {
  autocompleteCache.clear();
  stopAutomaticCleanup();
  console.debug('🧹 캐시 완전 초기화 완료');
}

/**
 * 캐시 시스템 활성화 (첫 사용 시 자동 호출)
 */
export function initializeCache(): void {
  startAutomaticCleanup();
}