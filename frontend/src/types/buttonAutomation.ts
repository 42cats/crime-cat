// ===== 기본 타입 정의 =====

export interface AutomationGroupData {
  id: string;
  guildId: string;
  name: string;
  displayOrder: number;
  settings: GroupSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupSettings {
  messageContent?: string;
  messageEmojis?: string[];
}

export interface AutomationButtonData {
  id: string;
  guildId: string;
  groupId: string;
  buttonLabel: string;
  displayOrder: number;
  config: ButtonConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== 버튼 설정 구조 =====

export interface ButtonConfig {
  trigger: TriggerConfig;
  actions: ActionConfig[];
  options: OptionsConfig;
  ui: UIConfig;
}

export interface TriggerConfig {
  type: 'user' | 'role' | 'admin' | 'everyone';
  value?: string; // user_id 또는 role_id
}

export interface ActionConfig {
  type: ActionType;
  order: number;
  target: 'executor' | 'specific' | 'all';
  targetValue?: string;
  parameters: Record<string, any>;
  conditions?: ActionConditions;
  delay?: number;
  result?: ActionResult;
}

export interface ActionConditions {
  requiredRoles?: string[];
  allowedRoles?: string[];
  deniedRoles?: string[];
  requiredChannelId?: string;
}

export interface ActionResult {
  message?: {
    type: 'none' | 'default' | 'custom';
    content?: string;
    visibility?: 'public' | 'private' | 'dm';
    deleteAfter?: number;
    emojis?: string[];
  };
}

export interface OptionsConfig {
  oncePerUser?: boolean;
  cooldownSeconds?: number;
  prompt?: {
    enabled: boolean;
    type?: 'select' | 'modal';
    title?: string;
    options?: Array<{
      label: string;
      value: string;
    }>;
  };
}

export interface UIConfig {
  style?: 'primary' | 'secondary' | 'success' | 'danger';
  disableAfter?: boolean;
  renameAfter?: string;
}

// ===== 액션 타입 정의 =====

export type ActionType = 
  | 'add_role'
  | 'remove_role' 
  | 'toggle_role'
  | 'change_nickname'
  | 'reset_nickname'
  | 'set_channel_permission'
  | 'remove_channel_permission'
  | 'send_message'
  | 'send_dm'
  | 'move_voice_channel'
  | 'disconnect_voice'
  | 'set_slowmode'
  | 'set_mute'
  | 'set_deafen'
  | 'timeout_user'
  | 'remove_timeout';

// ===== 액션 타입별 파라미터 정의 =====

export interface ActionTypeConfig {
  label: string;
  icon: string;
  description: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
    label: string;
    required: boolean;
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
  }>;
  requiredPermissions?: string[];
}

export const ACTION_TYPE_CONFIGS: Record<ActionType, ActionTypeConfig> = {
  add_role: {
    label: '역할 추가',
    icon: 'UserPlus',
    description: '사용자에게 역할을 부여합니다',
    parameters: [
      {
        name: 'roleId',
        type: 'select',
        label: '추가할 역할',
        required: true,
        placeholder: '역할을 선택하세요'
      }
    ],
    requiredPermissions: ['MANAGE_ROLES']
  },
  remove_role: {
    label: '역할 제거',
    icon: 'UserMinus',
    description: '사용자에게서 역할을 제거합니다',
    parameters: [
      {
        name: 'roleId',
        type: 'select',
        label: '제거할 역할',
        required: true,
        placeholder: '역할을 선택하세요'
      }
    ],
    requiredPermissions: ['MANAGE_ROLES']
  },
  change_nickname: {
    label: '닉네임 변경',
    icon: 'Edit',
    description: '사용자의 닉네임을 변경합니다',
    parameters: [
      {
        name: 'nickname',
        type: 'string',
        label: '새 닉네임',
        required: true,
        placeholder: '새로운 닉네임을 입력하세요'
      }
    ],
    requiredPermissions: ['MANAGE_NICKNAMES']
  },
  send_message: {
    label: '메시지 전송',
    icon: 'MessageSquare',
    description: '특정 채널에 메시지를 전송합니다',
    parameters: [
      {
        name: 'channelId',
        type: 'select',
        label: '전송할 채널',
        required: true,
        placeholder: '채널을 선택하세요'
      },
      {
        name: 'messageContent',
        type: 'string',
        label: '메시지 내용',
        required: true,
        placeholder: '전송할 메시지를 입력하세요'
      }
    ],
    requiredPermissions: ['SEND_MESSAGES']
  },
  set_slowmode: {
    label: '슬로우모드 설정',
    icon: 'Clock',
    description: '채널에 슬로우모드를 설정합니다',
    parameters: [
      {
        name: 'channelId',
        type: 'select',
        label: '대상 채널',
        required: true,
        placeholder: '채널을 선택하세요'
      },
      {
        name: 'seconds',
        type: 'number',
        label: '지연 시간(초)',
        required: true,
        placeholder: '0-21600 사이의 값'
      }
    ],
    requiredPermissions: ['MANAGE_CHANNELS']
  },
  timeout_user: {
    label: '사용자 타임아웃',
    icon: 'Clock',
    description: '사용자에게 타임아웃을 적용합니다',
    parameters: [
      {
        name: 'duration',
        type: 'number',
        label: '타임아웃 시간(분)',
        required: true,
        placeholder: '1-40320 사이의 값'
      },
      {
        name: 'reason',
        type: 'string',
        label: '사유',
        required: false,
        placeholder: '타임아웃 사유를 입력하세요'
      }
    ],
    requiredPermissions: ['MODERATE_MEMBERS']
  }
  // 필요시 다른 액션 타입들도 추가...
};

// ===== 미리보기용 텍스트 생성 인터페이스 =====

export interface ActionPreview {
  who: string;
  what: string;
  how: string;
  result?: string;
}

export interface ButtonPreview {
  trigger: string;
  actions: ActionPreview[];
  options: string[];
  flowText: string; // "누가 뭘하면 어떻게 된다" 형식의 전체 텍스트
}

// ===== API 요청/응답 타입 =====

export interface CreateGroupRequest {
  name: string;
  settings?: GroupSettings;
}

export interface UpdateGroupRequest extends CreateGroupRequest {
  displayOrder?: number;
  isActive?: boolean;
}

export interface CreateButtonRequest {
  groupId: string;
  buttonLabel: string;
  config: ButtonConfig;
}

export interface UpdateButtonRequest extends CreateButtonRequest {
  displayOrder?: number;
  isActive?: boolean;
}

export interface ButtonAutomationResponse {
  success: boolean;
  data?: AutomationButtonData | AutomationGroupData;
  error?: string;
}