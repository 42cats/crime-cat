import { useQuery } from '@tanstack/react-query';

/**
 * 자동완성 옵션 타입
 */
interface AutocompleteOption {
  name: string;
  value: string;
}

/**
 * 봇 커맨드 자동완성 메타데이터 타입
 */
interface CommandAutocompleteMetadata {
  commandName: string;
  subcommand: string;
  parameterName: string;
  apiEndpoint: string;
  hasMultiSelect: boolean;
}

/**
 * 그룹명 자동완성 훅 (버튼 커맨드용)
 * Discord 봇의 groupNames.js와 동일한 기능
 */
export const useGroupNamesAutocomplete = (guildId: string, query: string) => {
  return useQuery<AutocompleteOption[], Error>({
    queryKey: ['autocomplete', 'group-names', guildId, query],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/autocomplete/${guildId}/group-names?q=${encodeURIComponent(query)}`,
        {
          credentials: 'include', // JWT 쿠키 포함
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`자동완성 요청 실패: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: query.length >= 1 && !!guildId,
    staleTime: 30 * 1000, // 30초 캐싱
    retry: 1
  });
};

/**
 * 버튼 그룹 자동완성 훅 (기능버튼 커맨드용)
 * Discord 봇의 buttonGroups.js와 동일한 기능
 */
export const useButtonGroupsAutocomplete = (guildId: string, query: string) => {
  return useQuery<AutocompleteOption[], Error>({
    queryKey: ['autocomplete', 'button-groups', guildId, query],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/autocomplete/${guildId}/button-groups?q=${encodeURIComponent(query)}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`자동완성 요청 실패: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: query.length >= 1 && !!guildId,
    staleTime: 30 * 1000,
    retry: 1
  });
};

/**
 * 로그 파일명 자동완성 훅 (로그 커맨드용)
 * Discord 봇의 logFileName.js와 동일한 기능
 */
export const useLogFilesAutocomplete = (guildId: string, query: string) => {
  return useQuery<AutocompleteOption[], Error>({
    queryKey: ['autocomplete', 'log-files', guildId, query],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/autocomplete/${guildId}/log-files?q=${encodeURIComponent(query)}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`자동완성 요청 실패: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: query.length >= 1 && !!guildId,
    staleTime: 30 * 1000,
    retry: 1
  });
};

/**
 * 봇 커맨드 자동완성 메타데이터 훅
 * Redis 캐시된 봇 커맨드 정보에서 자동완성 설정 조회
 */
export const useBotCommandsMetadata = () => {
  return useQuery<CommandAutocompleteMetadata[], Error>({
    queryKey: ['autocomplete', 'commands-metadata'],
    queryFn: async () => {
      const response = await fetch('/api/v1/autocomplete/commands/metadata', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`메타데이터 요청 실패: ${response.status}`);
      }
      
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10분 캐싱 (봇 커맨드 구조는 자주 변경되지 않음)
    retry: 1
  });
};

/**
 * 통합 자동완성 훅
 * 파라미터명에 따라 적절한 자동완성 API 호출
 */
export const useAutocompleteOptions = (
  parameterName: string, 
  guildId: string, 
  query: string
) => {
  console.log("🔍 [useAutocompleteOptions] 훅 호출:", {
    parameterName,
    guildId,
    query,
    queryLength: query.length
  });

  // 파라미터명에 따른 훅 선택
  const groupNamesQuery = useGroupNamesAutocomplete(guildId, query);
  const buttonGroupsQuery = useButtonGroupsAutocomplete(guildId, query);
  const logFilesQuery = useLogFilesAutocomplete(guildId, query);

  // 파라미터명 매핑
  const getQueryByParameterName = () => {
    switch (parameterName) {
      case 'groupname':
      case 'groupnames':
        console.log("📡 [useAutocompleteOptions] group-names 선택됨");
        return groupNamesQuery;
      case '자동화_그룹':
        console.log("📡 [useAutocompleteOptions] button-groups 선택됨");
        return buttonGroupsQuery;
      case '파일명':
        console.log("📡 [useAutocompleteOptions] log-files 선택됨");
        return logFilesQuery;
      default:
        console.log("❌ [useAutocompleteOptions] 지원하지 않는 파라미터:", parameterName);
        return { data: [], isLoading: false, error: null };
    }
  };

  const result = getQueryByParameterName();
  
  console.log("📊 [useAutocompleteOptions] 최종 결과:", {
    parameterName,
    optionsCount: result.data?.length || 0,
    isLoading: result.isLoading,
    hasError: !!result.error,
    errorMessage: result.error?.message
  });

  return result;
};

/**
 * 파라미터에 자동완성이 있는지 확인하는 유틸리티 함수
 */
export const hasAutocomplete = (parameterName: string): boolean => {
  const autocompleteParameters = ['groupname', 'groupnames', '자동화_그룹', '파일명'];
  return autocompleteParameters.includes(parameterName);
};

/**
 * 멀티 선택 지원 여부 확인 유틸리티 함수
 */
export const isMultiSelect = (parameterName: string): boolean => {
  return parameterName === 'groupnames'; // groupnames만 멀티 선택 지원
};