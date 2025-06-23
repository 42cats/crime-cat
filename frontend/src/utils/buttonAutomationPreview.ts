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
      who = '버튼을 누른 사용자에게';
      break;
    case 'specific':
      if (params.targetUserId) {
        const user = users.find(u => u.id === params.targetUserId);
        who = `@${user?.username || '특정 사용자'}에게`;
      } else {
        who = '특정 사용자에게';
      }
      break;
    case 'role':
      if (params.targetRoleIds && Array.isArray(params.targetRoleIds)) {
        const roleNames = params.targetRoleIds.map((id: string) => {
          const role = roles.find(r => r.id === id);
          return `"${role?.name || `역할(${id.slice(0, 8)}...)`}"`;
        }).join(', ');
        who = `${roleNames} 역할을 가진 사용자들에게`;
      } else if (params.targetRoleId) {
        const role = roles.find(r => r.id === params.targetRoleId);
        who = `"${role?.name || `역할(${params.targetRoleId.slice(0, 8)}...)`}" 역할을 가진 사용자들에게`;
      } else {
        who = '특정 역할을 가진 사용자들에게';
      }
      break;
    case 'admin':
      who = '관리자 권한을 가진 사용자들에게';
      break;
    case 'all':
      who = '모든 사용자에게';
      break;
    default:
      who = '지정된 대상에게';
      break;
  }

  // 액션별 세부 내용
  switch (action.type) {
    case 'add_role': {
      const role = roles.find(r => r.id === params.roleId);
      what = `"${role?.name || '역할'}" 역할을`;
      how = '추가합니다';
      break;
    }
    case 'remove_role': {
      const role = roles.find(r => r.id === params.roleId);
      what = `"${role?.name || '역할'}" 역할을`;
      how = '제거합니다';
      break;
    }
    case 'toggle_role': {
      if (params.roleIds && Array.isArray(params.roleIds)) {
        const roleNames = params.roleIds.map((id: string) => {
          const role = roles.find(r => r.id === id);
          return `"${role?.name || '역할'}"`;
        }).join(', ');
        what = `${roleNames} 역할을`;
      } else {
        const role = roles.find(r => r.id === params.roleId);
        what = `"${role?.name || '역할'}" 역할을`;
      }
      how = '토글합니다';
      break;
    }
    case 'change_nickname': {
      what = `닉네임을 "${params.nickname || '새 닉네임'}"으로`;
      how = '변경합니다';
      break;
    }
    case 'reset_nickname': {
      what = '닉네임을';
      how = '초기화합니다';
      break;
    }
    case 'send_message': {
      const channel = channels.find(c => c.id === params.channelId);
      what = `#${channel?.name || '채널'}에 "${params.message || params.messageContent || '메시지'}"를`;
      how = '전송합니다';
      who = ''; // 메시지는 대상이 채널이므로
      break;
    }
    case 'send_dm': {
      what = `"${params.message || '개인 메시지'}"를`;
      how = '개인 메시지로 전송합니다';
      break;
    }
    case 'move_voice_channel': {
      const channel = channels.find(c => c.id === params.channelId);
      what = `#${channel?.name || '음성 채널'}로`;
      how = '이동시킵니다';
      break;
    }
    case 'disconnect_voice': {
      what = '음성 채널에서';
      how = '연결을 해제합니다';
      break;
    }
    case 'set_voice_mute': {
      what = `${params.duration || '무제한'}초 동안`;
      how = '음소거합니다';
      break;
    }
    case 'set_voice_deafen': {
      what = `${params.duration || '무제한'}초 동안`;
      how = '스피커를 차단합니다';
      break;
    }
    case 'toggle_voice_mute': {
      what = '마이크 상태를';
      how = '토글합니다';
      break;
    }
    case 'toggle_voice_deafen': {
      what = '스피커 상태를';
      how = '토글합니다';
      break;
    }
    case 'set_priority_speaker': {
      what = `우선 발언자 권한을 ${params.enable ? '활성화' : '비활성화'}`;
      how = '합니다';
      break;
    }
    case 'set_channel_permission': {
      const channel = channels.find(c => c.id === params.channelId);
      what = `#${channel?.name || '채널'}에 권한을`;
      how = '설정합니다';
      break;
    }
    case 'remove_channel_permission': {
      const channel = channels.find(c => c.id === params.channelId);
      what = `#${channel?.name || '채널'}의 권한을`;
      how = '제거합니다';
      break;
    }
    case 'override_channel_permission': {
      const channel = channels.find(c => c.id === params.channelId);
      what = `#${channel?.name || '채널'}의 권한을`;
      how = '오버라이드합니다';
      break;
    }
    case 'reset_channel_permission': {
      const channel = channels.find(c => c.id === params.channelId);
      what = `#${channel?.name || '채널'}의 권한을`;
      how = '초기화합니다';
      break;
    }
    case 'remove_timeout': {
      what = '타임아웃을';
      how = '해제합니다';
      break;
    }
    case 'kick_member': {
      what = '서버에서';
      how = '추방합니다';
      if (params.reason) {
        result = `사유: ${params.reason}`;
      }
      break;
    }
    case 'ban_member': {
      what = '서버에서';
      how = '차단합니다';
      if (params.reason) {
        result = `사유: ${params.reason}`;
      }
      break;
    }
    case 'warn_member': {
      what = '경고를';
      how = '부여합니다';
      if (params.reason) {
        result = `사유: ${params.reason}`;
      }
      break;
    }
    case 'add_timeout': {
      what = `${params.duration || 0}초 동안`;
      how = '타임아웃을 적용합니다';
      if (params.reason) {
        result = `사유: ${params.reason}`;
      }
      break;
    }
    case 'play_music': {
      what = `"${params.trackTitle || '선택된 음악'}"을`;
      how = '재생합니다';
      break;
    }
    case 'stop_music': {
      what = '음악 재생을';
      how = '정지합니다';
      break;
    }
    case 'pause_music': {
      what = '음악을';
      how = '일시정지/재개합니다';
      break;
    }
    case 'button_setting': {
      what = `버튼 설정을`;
      how = '변경합니다';
      if (params.buttonLabel) {
        result = `새 라벨: ${params.buttonLabel}`;
      }
      break;
    }
    case 'set_slowmode': {
      const channel = channels.find(c => c.id === params.channelId);
      what = `#${channel?.name || '채널'}에 ${params.seconds || 0}초`;
      how = '슬로우모드를 설정합니다';
      who = '';
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

  // 결과 메시지 추가 (visibility 설정에 따라)
  if (action.result?.message && action.result.visibility !== 'none') {
    const visibilityText = getVisibilityText(action.result.visibility || 'current_channel');
    const messageContent = action.result.message;
    
    const resultMessage = `${visibilityText}: "${messageContent}"`;
    result = result ? `${result} | ${resultMessage}` : resultMessage;
  } else if (action.result?.message && action.result.visibility === 'none') {
    // visibility가 none인 경우 메시지를 표시하지 않음
    // result에 아무것도 추가하지 않음
  }

  // Visibility 텍스트 헬퍼 함수
  function getVisibilityText(visibility: string): string {
    switch (visibility) {
      case 'none': return '';
      case 'ephemeral': return '🔒 개인 알림';
      case 'private': return '📨 개인 메시지';
      case 'current_channel': return '💬 공개 알림';
      case 'specific_channel': return '📢 채널 알림';
      default: return '💬 알림';
    }
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