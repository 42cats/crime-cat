import { useQuery } from '@tanstack/react-query';

/**
 * 향상된 봇 커맨드 데이터 타입
 */
export interface EnhancedBotCommand {
  name: string;
  description: string;
  type: string;
  category: string;
  isCacheCommand: boolean;
  subcommands: Record<string, EnhancedBotCommandSubcommand>;
  hasAutocompleteSupport: boolean;
  totalAutocompleteParameters: number;
}

export interface EnhancedBotCommandSubcommand {
  name: string;
  description: string;
  parameters: EnhancedBotCommandParameter[];
  autocompleteParameterCount: number;
}

export interface EnhancedBotCommandParameter {
  name: string;
  description: string;
  type: string;
  required: boolean;
  choices?: ParameterChoice[];
  hasAutocomplete: boolean;
  isMultiSelect: boolean;
  autocompleteType?: string;
  autocompleteEndpoint?: string;
}

export interface ParameterChoice {
  name: string;
  value: string;
}

export interface AutocompleteSummary {
  totalCommands: number;
  commandsWithAutocomplete: number;
  totalAutocompleteParameters: number;
  supportedAutocompleteTypes: string[];
}

export interface EnhancedBotCommandsResponse {
  success: boolean;
  commands: EnhancedBotCommand[];
  count: number;
  message?: string;
  autocompleteSummary: AutocompleteSummary;
}

/**
 * 향상된 봇 커맨드 조회 훅
 * 자동완성 메타데이터가 포함된 봇 커맨드 정보를 조회
 * 실패 시 기본 봇 커맨드 API로 폴백
 */
export const useEnhancedBotCommands = (guildId: string) => {
  return useQuery<EnhancedBotCommandsResponse, Error>({
    queryKey: ['enhanced-bot-commands', guildId],
    queryFn: async () => {
      if (!guildId) {
        throw new Error('Guild ID is required');
      }

      try {
        // 1차 시도: 향상된 API
        const response = await fetch(`/api/v1/automations/${guildId}/bot-commands-enhanced`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Enhanced API failed: ${response.status}`);
        }

        const data: EnhancedBotCommandsResponse = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Enhanced API returned failure');
        }

        return data;
      } catch (enhancedError) {
        console.warn('Enhanced bot commands API failed, trying fallback:', enhancedError);
        
        // 2차 시도: 기존 API로 폴백
        try {
          const fallbackResponse = await fetch(`/api/v1/automations/bot-commands`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!fallbackResponse.ok) {
            throw new Error(`Fallback API failed: ${fallbackResponse.status}`);
          }

          const fallbackData = await fallbackResponse.json();
          
          if (!fallbackData.success || !Array.isArray(fallbackData.commands)) {
            throw new Error('Fallback API returned invalid data');
          }

          // 기존 API 데이터를 향상된 형식으로 변환
          const enhancedCommands: EnhancedBotCommand[] = fallbackData.commands.map((cmd: any) => ({
            name: cmd.name,
            description: cmd.description,
            type: cmd.type || 'slash',
            category: cmd.category || 'utility',
            isCacheCommand: true,
            subcommands: cmd.subcommands || {},
            hasAutocompleteSupport: false, // 폴백에서는 자동완성 비활성화
            totalAutocompleteParameters: 0,
          }));

          const fallbackResponse_: EnhancedBotCommandsResponse = {
            success: true,
            commands: enhancedCommands,
            count: enhancedCommands.length,
            message: '기본 모드로 실행 중 (자동완성 기능 제한)',
            autocompleteSummary: {
              totalCommands: enhancedCommands.length,
              commandsWithAutocomplete: 0,
              totalAutocompleteParameters: 0,
              supportedAutocompleteTypes: [],
            },
          };

          return fallbackResponse_;
        } catch (fallbackError) {
          console.error('Both enhanced and fallback APIs failed:', fallbackError);
          throw new Error('봇 커맨드를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.');
        }
      }
    },
    enabled: !!guildId,
    staleTime: 10 * 60 * 1000, // 10분 캐싱
    retry: 2, // 재시도 횟수 증가
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
  });
};

/**
 * 자동완성 지원 파라미터 필터링 유틸리티
 */
export const getAutocompleteParameters = (command: EnhancedBotCommand): EnhancedBotCommandParameter[] => {
  const allParameters: EnhancedBotCommandParameter[] = [];
  
  Object.values(command.subcommands).forEach(subcommand => {
    subcommand.parameters
      .filter(param => param.hasAutocomplete)
      .forEach(param => allParameters.push(param));
  });
  
  return allParameters;
};

/**
 * 커맨드별 자동완성 지원 정보 조회
 */
export const getCommandAutocompleteInfo = (
  command: EnhancedBotCommand,
  subcommandName?: string
): {
  hasAutocomplete: boolean;
  autocompleteParameters: EnhancedBotCommandParameter[];
  supportedTypes: string[];
} => {
  let autocompleteParameters: EnhancedBotCommandParameter[] = [];
  
  if (subcommandName && command.subcommands[subcommandName]) {
    autocompleteParameters = command.subcommands[subcommandName].parameters
      .filter(param => param.hasAutocomplete);
  } else {
    autocompleteParameters = getAutocompleteParameters(command);
  }
  
  const supportedTypes = autocompleteParameters
    .map(param => param.autocompleteType)
    .filter((type): type is string => !!type);
    
  return {
    hasAutocomplete: autocompleteParameters.length > 0,
    autocompleteParameters,
    supportedTypes: [...new Set(supportedTypes)],
  };
};