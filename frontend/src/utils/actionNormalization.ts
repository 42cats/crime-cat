/**
 * ActionConfig 데이터 정규화 유틸리티
 * 기존 데이터 마이그레이션 및 무결성 보장
 */

import { ActionConfig, ActionType } from '../types/buttonAutomation';
import { generateActionId, isValidActionId } from './uuid';

/**
 * 단일 액션을 정규화
 * - ID가 없으면 생성
 * - 필수 필드 기본값 설정
 * - 데이터 타입 검증 및 수정
 */
export function normalizeAction(action: Partial<ActionConfig>, index: number): ActionConfig {
  // ID 정규화
  const id = action.id && isValidActionId(action.id) 
    ? action.id 
    : generateActionId();

  // 기본값 설정
  const normalizedAction: ActionConfig = {
    id,
    type: action.type || 'add_role',
    order: action.order ?? index,
    target: action.target || 'executor',
    targetValue: action.targetValue || '',
    parameters: action.parameters || {},
    conditions: action.conditions || undefined,
    delay: action.delay || 0,
    result: action.result || undefined
  };

  // 파라미터 정규화 (봇 커맨드 액션 특별 처리)
  if (normalizedAction.type === 'execute_bot_command') {
    normalizedAction.parameters = normalizeBotCommandParameters(normalizedAction.parameters);
  }

  return normalizedAction;
}

/**
 * 봇 커맨드 파라미터 정규화
 * 메타 파라미터와 커맨드 파라미터 구조 정리
 */
function normalizeBotCommandParameters(parameters: Record<string, any>): Record<string, any> {
  const metaParams = ['commandName', 'delay', 'silent', 'channelId', 'originalUserId', 'selectedSubcommand'];
  const normalized: Record<string, any> = {};

  // 메타 파라미터는 최상위에 유지
  metaParams.forEach(param => {
    if (parameters[param] !== undefined) {
      normalized[param] = parameters[param];
    }
  });

  // 기본값 설정
  if (!normalized.commandName) normalized.commandName = '';
  if (!normalized.delay) normalized.delay = 0;
  if (normalized.silent === undefined) normalized.silent = false;

  // 커맨드별 파라미터는 parameters 하위에 유지
  Object.keys(parameters).forEach(key => {
    if (!metaParams.includes(key)) {
      normalized[key] = parameters[key];
    }
  });

  return normalized;
}

/**
 * 액션 배열 전체를 정규화
 * 순서 재정렬 및 중복 ID 제거 포함
 */
export function normalizeActions(actions: (Partial<ActionConfig> | ActionConfig)[]): ActionConfig[] {
  if (!Array.isArray(actions)) {
    console.warn('🔧 Actions가 배열이 아님, 빈 배열로 초기화:', actions);
    return [];
  }

  const normalized = actions.map((action, index) => normalizeAction(action, index));
  
  // 중복 ID 검사 및 수정
  const seenIds = new Set<string>();
  const deduplicatedActions = normalized.map((action, index) => {
    if (seenIds.has(action.id)) {
      console.warn(`🔧 중복 액션 ID 감지: ${action.id}, 새 ID 생성`);
      return {
        ...action,
        id: generateActionId()
      };
    }
    seenIds.add(action.id);
    return action;
  });

  // order 필드 재정렬
  const reorderedActions = deduplicatedActions.map((action, index) => ({
    ...action,
    order: index
  }));


  return reorderedActions;
}

/**
 * 액션 배열 유효성 검증
 * 데이터 무결성 확인
 */
export function validateActions(actions: ActionConfig[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(actions)) {
    errors.push('Actions must be an array');
    return { isValid: false, errors };
  }

  actions.forEach((action, index) => {
    // ID 검증
    if (!action.id || !isValidActionId(action.id)) {
      errors.push(`Action ${index}: Invalid or missing ID`);
    }

    // 타입 검증
    if (!action.type) {
      errors.push(`Action ${index}: Missing action type`);
    }

    // order 검증
    if (action.order !== index) {
      errors.push(`Action ${index}: Order mismatch (expected ${index}, got ${action.order})`);
    }

    // parameters 검증
    if (!action.parameters || typeof action.parameters !== 'object') {
      errors.push(`Action ${index}: Invalid parameters object`);
    }
  });

  // 중복 ID 검증
  const ids = actions.map(a => a.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Duplicate action IDs detected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 액션 상태 불일치 감지
 * 디버깅을 위한 상태 검증
 */
export function detectActionStateMismatch(
  actions: ActionConfig[], 
  expectedValues: Record<string, any>
): { hasMismatch: boolean; mismatches: Array<{ actionId: string; field: string; expected: any; actual: any }> } {
  const mismatches: Array<{ actionId: string; field: string; expected: any; actual: any }> = [];

  actions.forEach((action, index) => {
    if (action.type === 'execute_bot_command') {
      const expectedCommand = expectedValues[`action_${index}_commandName`];
      const actualCommand = action.parameters?.commandName;
      
      if (expectedCommand && expectedCommand !== actualCommand) {
        mismatches.push({
          actionId: action.id,
          field: 'commandName',
          expected: expectedCommand,
          actual: actualCommand
        });
      }
    }
  });

  if (mismatches.length > 0) {
    console.error('🚨 액션 상태 불일치 감지:', mismatches);
  }

  return {
    hasMismatch: mismatches.length > 0,
    mismatches
  };
}