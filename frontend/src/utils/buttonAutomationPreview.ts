import { 
  ButtonConfig, 
  ActionConfig, 
  ActionPreview, 
  ButtonPreview, 
  ACTION_TYPE_CONFIGS,
  TriggerConfig 
} from '../types/buttonAutomation';

/**
 * 트리거 설정을 사용자 친화적 텍스트로 변환
 */
export function getTriggerText(trigger: TriggerConfig, roles: any[], users: any[]): string {
  switch (trigger.type) {
    case 'everyone':
      return '🌍 모든 사람이';
    case 'admin':
      return '👑 관리자가';
    case 'role':
      if (trigger.value) {
        const role = roles.find(r => r.id === trigger.value);
        return `🎭 ${role?.name || '알 수 없는 역할'}을 가진 사람이`;
      }
      return '🎭 특정 역할을 가진 사람이';
    case 'user':
      if (trigger.value) {
        const user = users.find(u => u.id === trigger.value);
        return `👤 ${user?.username || '특정 사용자'}가`;
      }
      return '👤 특정 사용자가';
    default:
      return '누군가가';
  }
}

/**
 * 액션을 사용자 친화적 텍스트로 변환
 */
export function getActionPreview(
  action: ActionConfig, 
  roles: any[], 
  channels: any[]
): ActionPreview {
  const config = ACTION_TYPE_CONFIGS[action.type];
  const params = action.parameters || {};
  
  let who = '';
  let what = '';
  let how = '';
  let result = '';

  // 대상 설정
  switch (action.target) {
    case 'executor':
      who = '버튼을 누른 사람에게';
      break;
    case 'specific':
      who = '특정 사용자에게';
      break;
    case 'all':
      who = '모든 사람에게';
      break;
  }

  // 액션별 세부 내용
  switch (action.type) {
    case 'add_role': {
      const role = roles.find(r => r.id === params.roleId);
      what = `${role?.name || '역할'}을`;
      how = '추가합니다';
      break;
    }
    case 'remove_role': {
      const role = roles.find(r => r.id === params.roleId);
      what = `${role?.name || '역할'}을`;
      how = '제거합니다';
      break;
    }
    case 'change_nickname': {
      what = `닉네임을 "${params.nickname || '새 닉네임'}"으로`;
      how = '변경합니다';
      break;
    }
    case 'send_message': {
      const channel = channels.find(c => c.id === params.channelId);
      what = `#${channel?.name || '채널'}에 "${params.messageContent || '메시지'}"를`;
      how = '전송합니다';
      who = ''; // 메시지는 대상이 채널이므로
      break;
    }
    case 'set_slowmode': {
      const channel = channels.find(c => c.id === params.channelId);
      what = `#${channel?.name || '채널'}에 ${params.seconds || 0}초`;
      how = '슬로우모드를 설정합니다';
      who = '';
      break;
    }
    case 'timeout_user': {
      what = `${params.duration || 0}분간`;
      how = '타임아웃을 적용합니다';
      if (params.reason) {
        result = `사유: ${params.reason}`;
      }
      break;
    }
    default: {
      what = config?.label || action.type;
      how = '을 실행합니다';
    }
  }

  // 지연 시간 추가
  if (action.delay && action.delay > 0) {
    how += ` (${action.delay}초 후)`;
  }

  // 결과 메시지 추가
  if (action.result?.message?.type === 'custom' && action.result.message.content) {
    result = result ? 
      `${result} | 알림: "${action.result.message.content}"` :
      `알림: "${action.result.message.content}"`;
  }

  return { who: who.trim(), what: what.trim(), how: how.trim(), result: result.trim() };
}

/**
 * 옵션을 사용자 친화적 텍스트로 변환
 */
export function getOptionsText(config: ButtonConfig): string[] {
  const options: string[] = [];

  if (config.options?.oncePerUser) {
    options.push('🔒 한 번만 실행 가능');
  }

  if (config.options?.cooldownSeconds && config.options.cooldownSeconds > 0) {
    const seconds = config.options.cooldownSeconds;
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      options.push(`⏱️ ${minutes}분 쿨다운`);
    } else {
      options.push(`⏱️ ${seconds}초 쿨다운`);
    }
  }

  if (config.options?.prompt?.enabled) {
    const promptType = config.options.prompt.type === 'modal' ? '입력창' : '선택창';
    options.push(`💬 실행 전 ${promptType} 표시`);
  }

  if (config.ui?.disableAfter) {
    options.push('🚫 실행 후 버튼 비활성화');
  }

  if (config.ui?.renameAfter) {
    options.push(`🔄 실행 후 "${config.ui.renameAfter}"로 텍스트 변경`);
  }

  return options;
}

/**
 * 전체 버튼 설정을 사용자 친화적 플로우 텍스트로 변환
 */
export function generateFlowText(
  config: ButtonConfig,
  roles: any[] = [],
  channels: any[] = [],
  users: any[] = []
): string {
  const triggerText = getTriggerText(config.trigger, roles, users);
  const actionPreviews = config.actions
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(action => getActionPreview(action, roles, channels));
  
  let flowText = `${triggerText} 버튼을 클릭하면:\n\n`;

  actionPreviews.forEach((preview, index) => {
    const step = index + 1;
    if (preview.who) {
      flowText += `${step}. ${preview.who} ${preview.what} ${preview.how}\n`;
    } else {
      flowText += `${step}. ${preview.what} ${preview.how}\n`;
    }
    
    if (preview.result) {
      flowText += `   📢 ${preview.result}\n`;
    }
  });

  const options = getOptionsText(config);
  if (options.length > 0) {
    flowText += `\n⚙️ 추가 설정:\n`;
    options.forEach(option => {
      flowText += `• ${option}\n`;
    });
  }

  return flowText;
}

/**
 * 전체 버튼 미리보기 생성
 */
export function generateButtonPreview(
  config: ButtonConfig,
  roles: any[] = [],
  channels: any[] = [],
  users: any[] = []
): ButtonPreview {
  const triggerText = getTriggerText(config.trigger, roles, users);
  const actionPreviews = config.actions
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(action => getActionPreview(action, roles, channels));
  const options = getOptionsText(config);
  const flowText = generateFlowText(config, roles, channels, users);

  return {
    trigger: triggerText,
    actions: actionPreviews,
    options,
    flowText
  };
}

/**
 * JSON 설정 유효성 검사
 */
export function validateButtonConfig(config: Partial<ButtonConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 트리거 검증
  if (!config.trigger) {
    errors.push('트리거 설정이 필요합니다');
  } else {
    if (!['user', 'role', 'admin', 'everyone'].includes(config.trigger.type)) {
      errors.push('올바른 트리거 타입을 선택해주세요');
    }
    if ((config.trigger.type === 'user' || config.trigger.type === 'role') && !config.trigger.value) {
      errors.push('특정 사용자/역할 트리거를 선택했을 때는 대상을 지정해주세요');
    }
  }

  // 액션 검증
  if (!config.actions || config.actions.length === 0) {
    errors.push('최소 하나의 액션이 필요합니다');
  } else {
    config.actions.forEach((action, index) => {
      if (!action.type) {
        errors.push(`액션 ${index + 1}: 액션 타입이 필요합니다`);
      }
      
      const actionConfig = ACTION_TYPE_CONFIGS[action.type];
      if (actionConfig) {
        actionConfig.parameters.forEach(param => {
          if (param.required && !action.parameters?.[param.name]) {
            errors.push(`액션 ${index + 1}: ${param.label}이 필요합니다`);
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 예시 설정 생성 (테스트용)
 */
export function createExampleConfig(): ButtonConfig {
  return {
    trigger: {
      type: 'everyone'
    },
    actions: [
      {
        type: 'add_role',
        order: 1,
        target: 'executor',
        parameters: {
          roleId: 'example_role_id'
        },
        delay: 0,
        result: {
          message: {
            type: 'custom',
            content: '{user}님이 참가자가 되었습니다! 🎉',
            visibility: 'public',
            deleteAfter: 10
          }
        }
      }
    ],
    options: {
      oncePerUser: true,
      cooldownSeconds: 0,
      prompt: {
        enabled: false
      }
    },
    ui: {
      style: 'primary',
      disableAfter: false
    }
  };
}