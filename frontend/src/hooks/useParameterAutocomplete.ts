/**
 * 파라미터 자동완성 React Query 훅
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { 
  AutocompleteChoice, 
  AutocompleteRequest, 
  AutocompleteResponse,
  ParameterContext,
  EnhancedBotCommandParameter
} from '../types/parameterAutocomplete';
import { 
  fetchParameterChoices, 
  fetchGuildChannels,
  fetchGuildRoles,
  autocompleteProviders, 
  filterChoices 
} from '../services/parameterAutocompleteService';

/**
 * 파라미터 자동완성 데이터 조회 훅
 */
export function useParameterAutocomplete(
  commandName: string,
  parameter: EnhancedBotCommandParameter,
  context: ParameterContext,
  query: string = '',
  enabled: boolean = true
): UseQueryResult<AutocompleteChoice[], Error> & {
  filteredChoices: AutocompleteChoice[];
  isSearching: boolean;
} {
  const [searchQuery, setSearchQuery] = useState(query);
  
  // 검색 쿼리 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(query);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]);

  // 자동완성 타입 결정
  const autocompleteType = parameter.autocomplete?.type || 
    (parameter.choices?.length ? 'static' : 'dynamic');

  // Query key 생성
  const queryKey = [
    'parameterAutocomplete',
    commandName,
    parameter.name,
    autocompleteType,
    searchQuery,
    context.guildId,
    JSON.stringify(context)
  ];

  // 데이터 페처 함수
  const fetchData = async (): Promise<AutocompleteChoice[]> => {
    // 정적 선택지가 있는 경우
    if (parameter.choices?.length) {
      return parameter.choices;
    }

    // 내장 제공자 사용 (새로운 API 구조)
    if (autocompleteType in autocompleteProviders) {
      const provider = autocompleteProviders[autocompleteType as keyof typeof autocompleteProviders];
      return await provider(context);
    }

    // 파라미터 타입별 직접 조회
    switch (parameter.type) {
      case 'channel':
        return await fetchGuildChannels(context.guildId);
      case 'role':
        return await fetchGuildRoles(context.guildId);
      default:
        // 동적 API 호출 (새로운 백엔드 구조 사용)
        const request: AutocompleteRequest = {
          commandName,
          parameterName: parameter.name,
          query: searchQuery,
          context,
          limit: 50
        };
        
        const response = await fetchParameterChoices(request);
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch autocomplete data');
        }
        
        return response.choices;
    }
  };

  // React Query 설정
  const queryResult = useQuery({
    queryKey,
    queryFn: fetchData,
    enabled: enabled && !!commandName && !!parameter.name,
    staleTime: parameter.autocomplete?.cacheDuration ? 
      parameter.autocomplete.cacheDuration * 1000 : 
      5 * 60 * 1000, // 기본 5분
    cacheTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.warn('자동완성 조회 실패:', error);
      return failureCount < 2; // 최대 2회 재시도
    }
  });

  // 검색 필터링
  const filteredChoices = useMemo(() => {
    if (!queryResult.data) return [];
    
    // 로컬 검색이 비활성화된 경우 원본 데이터 반환
    if (parameter.autocomplete?.searchable === false) {
      return queryResult.data;
    }
    
    return filterChoices(queryResult.data, query);
  }, [queryResult.data, query, parameter.autocomplete?.searchable]);

  return {
    ...queryResult,
    filteredChoices,
    isSearching: queryResult.isFetching && searchQuery.length > 0
  };
}

/**
 * 파라미터 의존성 관리 훅
 */
export function useParameterDependencies(
  command: { parameters: EnhancedBotCommandParameter[] },
  currentParameters: Record<string, any>,
  guildId: string
) {
  const [dependentData, setDependentData] = useState<Record<string, AutocompleteChoice[]>>({});
  const [loadingDependencies, setLoadingDependencies] = useState<string[]>([]);

  useEffect(() => {
    const processDependencies = async () => {
      const dependentParams = command.parameters.filter(p => 
        p.autocomplete?.dependencies?.length
      );

      for (const param of dependentParams) {
        const deps = param.autocomplete!.dependencies!;
        const hasAllDeps = deps.every(dep => currentParameters[dep]);

        if (hasAllDeps) {
          const paramKey = param.name;
          setLoadingDependencies(prev => [...prev, paramKey]);

          try {
            const context: ParameterContext = {
              guildId,
              ...currentParameters
            };

            // 의존성 기반 데이터 로딩
            let choices: AutocompleteChoice[] = [];

            if (param.autocomplete!.type in autocompleteProviders) {
              const provider = autocompleteProviders[param.autocomplete!.type as keyof typeof autocompleteProviders];
              choices = await provider(context);
            } else {
              // 새로운 API 구조 사용
              const request: AutocompleteRequest = {
                commandName: 'dependency',
                parameterName: param.name,
                context
              };
              const response = await fetchParameterChoices(request);
              if (response.success) {
                choices = response.choices;
              }
            }

            setDependentData(prev => ({
              ...prev,
              [paramKey]: choices
            }));
          } catch (error) {
            console.error(`의존성 데이터 로딩 실패 [${param.name}]:`, error);
            setDependentData(prev => ({
              ...prev,
              [paramKey]: []
            }));
          } finally {
            setLoadingDependencies(prev => prev.filter(p => p !== paramKey));
          }
        } else {
          // 의존성이 충족되지 않은 경우 데이터 초기화
          setDependentData(prev => {
            const newData = { ...prev };
            delete newData[param.name];
            return newData;
          });
        }
      }
    };

    processDependencies();
  }, [command.parameters, currentParameters, guildId]);

  return {
    dependentData,
    loadingDependencies,
    hasDependentData: (paramName: string) => paramName in dependentData,
    getDependentChoices: (paramName: string) => dependentData[paramName] || []
  };
}

/**
 * 멀티플 자동완성 관리 훅
 */
export function useMultipleAutocomplete(
  selectedValues: string[],
  availableChoices: AutocompleteChoice[],
  onChange: (values: string[]) => void
) {
  const selectedChoices = useMemo(() => 
    selectedValues.map(value => 
      availableChoices.find(choice => choice.value === value)
    ).filter(Boolean) as AutocompleteChoice[],
    [selectedValues, availableChoices]
  );

  const availableForSelection = useMemo(() =>
    availableChoices.filter(choice => 
      !selectedValues.includes(choice.value) && !choice.disabled
    ),
    [availableChoices, selectedValues]
  );

  const addValue = (value: string) => {
    if (!selectedValues.includes(value)) {
      onChange([...selectedValues, value]);
    }
  };

  const removeValue = (value: string) => {
    onChange(selectedValues.filter(v => v !== value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return {
    selectedChoices,
    availableForSelection,
    addValue,
    removeValue,
    clearAll,
    hasSelection: selectedValues.length > 0,
    selectionCount: selectedValues.length
  };
}