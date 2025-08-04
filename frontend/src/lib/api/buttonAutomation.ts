import { apiClient } from '../api';
import { ButtonAutomationGroup, ButtonAutomation } from '../../types/buttonAutomation';
import { GroupFormData } from '../../components/ButtonAutomation/GroupForm';
import { ButtonFormData } from '../../components/ButtonAutomation/ButtonForm';
import { transformButtonConfigForBackend, transformButtonConfigForFrontend } from '../../utils/parameterMapping';

// 통계 인터페이스
export interface AutomationStats {
  groupCount: number;
  buttonCount: number;
}

// 그룹 요청 DTO
export interface GroupRequestDto {
  name: string;
  displayOrder?: number;
  settings?: string; // JSON string
  isActive?: boolean;
}

// 버튼 요청 DTO
export interface ButtonRequestDto {
  groupId?: string;
  buttonLabel: string;
  displayOrder?: number;
  config: string; // JSON string
  isActive?: boolean;
}

// 복사 요청 DTO
export interface CopyGroupRequestDto {
  newName?: string; // 선택사항, null이면 자동 생성
}

export interface CopyButtonRequestDto {
  targetGroupId?: string; // 선택사항, null이면 원본과 동일 그룹
  newLabel?: string; // 선택사항, null이면 자동 생성
}

export const buttonAutomationApi = {
  // ===== 그룹 관리 =====

  /**
   * 특정 길드의 모든 그룹 조회
   */
  getGroups: (guildId: string): Promise<ButtonAutomationGroup[]> => {
    return apiClient.get(`/automations/${guildId}/groups`);
  },

  /**
   * 새 그룹 생성
   */
  createGroup: (guildId: string, data: GroupFormData): Promise<ButtonAutomationGroup> => {
    const requestData: GroupRequestDto = {
      name: data.name,
      displayOrder: data.displayOrder,
      settings: data.settings ? JSON.stringify(data.settings) : undefined,
      isActive: data.isActive
    };
    return apiClient.post(`/automations/${guildId}/groups`, requestData);
  },

  /**
   * 그룹 수정
   */
  updateGroup: (guildId: string, groupId: string, data: GroupFormData): Promise<ButtonAutomationGroup> => {
    const requestData: GroupRequestDto = {
      name: data.name,
      displayOrder: data.displayOrder,
      settings: data.settings ? JSON.stringify(data.settings) : undefined,
      isActive: data.isActive
    };
    return apiClient.put(`/automations/${guildId}/groups/${groupId}`, requestData);
  },

  /**
   * 그룹 삭제
   */
  deleteGroup: (guildId: string, groupId: string): Promise<void> => {
    return apiClient.delete(`/automations/${guildId}/groups/${groupId}`);
  },

  // ===== 버튼 관리 =====

  /**
   * 특정 길드의 모든 버튼 조회
   */
  getButtons: async (guildId: string): Promise<ButtonAutomation[]> => {
    const buttons = await apiClient.get<ButtonAutomation[]>(`/automations/${guildId}/buttons`);
    
    // 각 버튼의 config를 프론트엔드용으로 역변환
    return buttons.map(button => {
      try {
        const parsedConfig = JSON.parse(button.config);
        const transformedConfigObj = transformButtonConfigForFrontend(parsedConfig);
        return {
          ...button,
          config: JSON.stringify(transformedConfigObj)
        };
      } catch (error) {
        console.warn('버튼 설정 역변환 실패, 원본 사용:', error);
        return button;
      }
    });
  },

  /**
   * 특정 그룹의 버튼들 조회
   */
  getButtonsByGroup: async (guildId: string, groupId: string): Promise<ButtonAutomation[]> => {
    const buttons = await apiClient.get<ButtonAutomation[]>(`/automations/${guildId}/groups/${groupId}/buttons`);
    
    // 각 버튼의 config를 프론트엔드용으로 역변환
    return buttons.map(button => {
      try {
        const parsedConfig = JSON.parse(button.config);
        const transformedConfigObj = transformButtonConfigForFrontend(parsedConfig);
        return {
          ...button,
          config: JSON.stringify(transformedConfigObj)
        };
      } catch (error) {
        console.warn('버튼 설정 역변환 실패, 원본 사용:', error);
        return button;
      }
    });
  },

  /**
   * 특정 버튼 조회
   */
  getButton: async (guildId: string, buttonId: string): Promise<ButtonAutomation> => {
    const button = await apiClient.get<ButtonAutomation>(`/automations/${guildId}/buttons/${buttonId}`);
    
    // config를 파싱하여 프론트엔드용으로 변환
    try {
      const parsedConfig = JSON.parse(button.config);
      const transformedConfigObj = transformButtonConfigForFrontend(parsedConfig);
      button.config = JSON.stringify(transformedConfigObj);
    } catch (error) {
      console.warn('버튼 설정 역변환 실패, 원본 사용:', error);
    }
    
    return button;
  },

  /**
   * 새 버튼 생성
   */
  createButton: (guildId: string, data: ButtonFormData): Promise<ButtonAutomation> => {
    // config를 파싱하여 파라미터 변환 적용
    let transformedConfig = data.config;
    try {
      const parsedConfig = JSON.parse(data.config);
      const transformedConfigObj = transformButtonConfigForBackend(parsedConfig);
      transformedConfig = JSON.stringify(transformedConfigObj);
    } catch (error) {
      console.warn('버튼 설정 파싱 실패, 원본 사용:', error);
    }

    const requestData: ButtonRequestDto = {
      groupId: data.groupId,
      buttonLabel: data.buttonLabel,
      displayOrder: data.displayOrder,
      config: transformedConfig,
      isActive: data.isActive
    };
    return apiClient.post(`/automations/${guildId}/buttons`, requestData);
  },

  /**
   * 버튼 수정
   */
  updateButton: (guildId: string, buttonId: string, data: ButtonFormData): Promise<ButtonAutomation> => {
    // config를 파싱하여 파라미터 변환 적용
    let transformedConfig = data.config;
    try {
      const parsedConfig = JSON.parse(data.config);
      const transformedConfigObj = transformButtonConfigForBackend(parsedConfig);
      transformedConfig = JSON.stringify(transformedConfigObj);
    } catch (error) {
      console.warn('버튼 설정 파싱 실패, 원본 사용:', error);
    }

    const requestData: ButtonRequestDto = {
      groupId: data.groupId,
      buttonLabel: data.buttonLabel,
      displayOrder: data.displayOrder,
      config: transformedConfig,
      isActive: data.isActive
    };
    return apiClient.put(`/automations/${guildId}/buttons/${buttonId}`, requestData);
  },

  /**
   * 버튼 삭제
   */
  deleteButton: (guildId: string, buttonId: string): Promise<void> => {
    return apiClient.delete(`/automations/${guildId}/buttons/${buttonId}`);
  },

  // ===== 복사 기능 =====

  /**
   * 그룹 복사 (모든 버튼 포함)
   */
  copyGroup: (guildId: string, groupId: string, data?: CopyGroupRequestDto): Promise<ButtonAutomationGroup> => {
    return apiClient.post(`/automations/${guildId}/groups/${groupId}/copy`, data || {});
  },

  /**
   * 버튼 복사
   */
  copyButton: (guildId: string, buttonId: string, data?: CopyButtonRequestDto): Promise<ButtonAutomation> => {
    return apiClient.post(`/automations/${guildId}/buttons/${buttonId}/copy`, data || {});
  },

  // ===== 통계 =====

  /**
   * 길드의 자동화 통계 조회
   */
  getStats: (guildId: string): Promise<AutomationStats> => {
    return apiClient.get(`/automations/${guildId}/stats`);
  },

  // ===== 유틸리티 =====

  /**
   * 설정 JSON 유효성 검증
   */
  validateConfig: (config: string): boolean => {
    try {
      JSON.parse(config);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * 그룹 설정을 안전하게 파싱
   */
  parseGroupSettings: (settings?: string) => {
    if (!settings) return {};
    try {
      return JSON.parse(settings);
    } catch (error) {
      console.error('Failed to parse group settings:', error);
      return {};
    }
  },

  /**
   * 버튼 설정을 안전하게 파싱
   */
  parseButtonConfig: (config: string) => {
    try {
      return JSON.parse(config);
    } catch (error) {
      console.error('Failed to parse button config:', error);
      return {
        trigger: { type: 'everyone', roles: [], users: [] },
        actions: [],
        buttonSettings: { style: 'primary', disableAfterUse: false },
        options: { oncePerUser: false, logEnabled: true }
      };
    }
  }
};

// 타입 가드 함수들
export const isValidButtonAutomationGroup = (obj: any): obj is ButtonAutomationGroup => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.guildId === 'string' &&
    typeof obj.displayOrder === 'number' &&
    typeof obj.isActive === 'boolean';
};

export const isValidButtonAutomation = (obj: any): obj is ButtonAutomation => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.guildId === 'string' &&
    typeof obj.buttonLabel === 'string' &&
    typeof obj.displayOrder === 'number' &&
    typeof obj.config === 'string' &&
    typeof obj.isActive === 'boolean';
};

// 에러 처리 래퍼
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  errorMessage: string = '요청 중 오류가 발생했습니다.'
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    console.error('API Error:', error);
    
    // 백엔드에서 온 에러 메시지가 있으면 사용
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // HTTP 상태코드별 메시지
    if (error.response?.status === 404) {
      throw new Error('요청한 데이터를 찾을 수 없습니다.');
    } else if (error.response?.status === 403) {
      throw new Error('해당 작업에 대한 권한이 없습니다.');
    } else if (error.response?.status === 400) {
      throw new Error('잘못된 요청입니다. 입력값을 확인해주세요.');
    }
    
    throw new Error(errorMessage);
  }
};