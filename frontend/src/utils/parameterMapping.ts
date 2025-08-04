/**
 * 프론트엔드 ↔ 백엔드 파라미터 매핑 유틸리티
 * 
 * 프론트엔드와 백엔드 간 파라미터명 차이를 해결하기 위한 변환 함수들
 */

import { ActionConfig } from '../types/buttonAutomation';

/**
 * 액션별 파라미터 매핑 규칙
 */
const PARAMETER_MAPPINGS = {
  send_message: {
    // 프론트엔드 → 백엔드
    toBackend: {
      messageContent: 'message'  // messageContent → message
    },
    // 백엔드 → 프론트엔드  
    toFrontend: {
      message: 'messageContent'  // message → messageContent
    }
  }
  // 필요시 다른 액션 타입도 추가 가능
};

/**
 * 단일 액션의 파라미터를 백엔드 형식으로 변환
 */
function transformActionParametersForBackend(action: ActionConfig): ActionConfig {
  const mapping = PARAMETER_MAPPINGS[action.type as keyof typeof PARAMETER_MAPPINGS];
  
  if (!mapping) {
    return action; // 매핑 규칙이 없으면 그대로 반환
  }

  const transformedParameters = { ...action.parameters };
  
  // 파라미터명 변환
  Object.entries(mapping.toBackend).forEach(([frontendKey, backendKey]) => {
    if (transformedParameters[frontendKey] !== undefined) {
      transformedParameters[backendKey] = transformedParameters[frontendKey];
      delete transformedParameters[frontendKey]; // 원본 키 제거
    }
  });

  // send_message 액션의 특별 처리: reactions를 messageOptions에도 추가
  if (action.type === 'send_message' && transformedParameters.reactions) {
    if (!transformedParameters.messageOptions) {
      transformedParameters.messageOptions = {};
    }
    transformedParameters.messageOptions.reactions = transformedParameters.reactions;
  }

  return {
    ...action,
    parameters: transformedParameters
  };
}

/**
 * 단일 액션의 파라미터를 프론트엔드 형식으로 변환
 */
function transformActionParametersForFrontend(action: ActionConfig): ActionConfig {
  const mapping = PARAMETER_MAPPINGS[action.type as keyof typeof PARAMETER_MAPPINGS];
  
  if (!mapping) {
    return action; // 매핑 규칙이 없으면 그대로 반환
  }

  const transformedParameters = { ...action.parameters };
  
  // 파라미터명 변환
  Object.entries(mapping.toFrontend).forEach(([backendKey, frontendKey]) => {
    if (transformedParameters[backendKey] !== undefined) {
      transformedParameters[frontendKey] = transformedParameters[backendKey];
      delete transformedParameters[backendKey]; // 원본 키 제거
    }
  });

  // send_message 액션의 특별 처리: messageOptions.reactions에서 reactions로 복원
  if (action.type === 'send_message' && transformedParameters.messageOptions?.reactions) {
    if (!transformedParameters.reactions) {
      transformedParameters.reactions = transformedParameters.messageOptions.reactions;
    }
    // messageOptions는 프론트엔드에서 불필요하므로 제거
    delete transformedParameters.messageOptions;
  }

  return {
    ...action,
    parameters: transformedParameters
  };
}

/**
 * 액션 배열을 백엔드 형식으로 변환
 */
export function transformActionsForBackend(actions: ActionConfig[]): ActionConfig[] {
  return actions.map(transformActionParametersForBackend);
}

/**
 * 액션 배열을 프론트엔드 형식으로 변환
 */
export function transformActionsForFrontend(actions: ActionConfig[]): ActionConfig[] {
  return actions.map(transformActionParametersForFrontend);
}

/**
 * 단일 액션을 백엔드 형식으로 변환 (외부 사용용)
 */
export function transformActionForBackend(action: ActionConfig): ActionConfig {
  return transformActionParametersForBackend(action);
}

/**
 * 단일 액션을 프론트엔드 형식으로 변환 (외부 사용용)
 */
export function transformActionForFrontend(action: ActionConfig): ActionConfig {
  return transformActionParametersForFrontend(action);
}

/**
 * ButtonConfig 전체를 백엔드 형식으로 변환
 */
export function transformButtonConfigForBackend(config: any): any {
  if (!config || !config.actions) {
    return config;
  }

  return {
    ...config,
    actions: transformActionsForBackend(config.actions)
  };
}

/**
 * ButtonConfig 전체를 프론트엔드 형식으로 변환
 */
export function transformButtonConfigForFrontend(config: any): any {
  if (!config || !config.actions) {
    return config;
  }

  return {
    ...config,
    actions: transformActionsForFrontend(config.actions)
  };
}

/**
 * 변환 로그 (디버깅용)
 */
export function logParameterTransformation(
  action: ActionConfig, 
  direction: 'toBackend' | 'toFrontend'
): void {
  const mapping = PARAMETER_MAPPINGS[action.type as keyof typeof PARAMETER_MAPPINGS];
  
  if (mapping) {
    console.log(`🔄 [ParamMapping] ${action.type} 액션 파라미터 변환 (${direction}):`, {
      before: action.parameters,
      mapping: direction === 'toBackend' ? mapping.toBackend : mapping.toFrontend
    });
  }
}