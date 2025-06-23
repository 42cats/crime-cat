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
  target: 'executor' | 'specific' | 'admin';
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
  message?: string;
  visibility?: 'none' | 'ephemeral' | 'private' | 'current_channel' | 'specific_channel';
  channelId?: string;
  deleteAfter?: number;
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
  | 'override_channel_permission'
  | 'reset_channel_permission'
  | 'send_message'
  | 'send_dm'
  | 'move_voice_channel'
  | 'disconnect_voice'
  | 'set_slowmode'
  | 'set_voice_mute'
  | 'set_voice_deafen'
  | 'toggle_voice_mute'
  | 'toggle_voice_deafen'
  | 'set_priority_speaker'
  | 'timeout_user'
  | 'remove_timeout'
  | 'button_setting';

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
  },
  toggle_role: {
    label: '역할 토글',
    icon: 'ToggleRight',
    description: '사용자의 역할을 토글합니다 (있으면 제거, 없으면 추가)',
    parameters: [
      {
        name: 'roleId',
        type: 'select',
        label: '토글할 역할',
        required: true,
        placeholder: '역할을 선택하세요'
      }
    ],
    requiredPermissions: ['MANAGE_ROLES']
  },
  reset_nickname: {
    label: '닉네임 초기화',
    icon: 'RotateCcw',
    description: '사용자의 닉네임을 원래대로 되돌립니다',
    parameters: [],
    requiredPermissions: ['MANAGE_NICKNAMES']
  },
  set_channel_permission: {
    label: '채널 권한 설정',
    icon: 'Shield',
    description: '특정 채널에 대한 권한을 설정합니다',
    parameters: [
      {
        name: 'channelId',
        type: 'select',
        label: '대상 채널',
        required: true,
        placeholder: '채널을 선택하세요'
      },
      {
        name: 'permission',
        type: 'select',
        label: '권한 유형',
        required: true,
        options: [
          { label: '채널 보기', value: 'VIEW_CHANNEL' },
          { label: '메시지 전송', value: 'SEND_MESSAGES' },
          { label: '음성 연결', value: 'CONNECT' },
          { label: '말하기', value: 'SPEAK' },
          { label: '메시지 관리', value: 'MANAGE_MESSAGES' },
          { label: '파일 첨부', value: 'ATTACH_FILES' },
          { label: '링크 임베드', value: 'EMBED_LINKS' },
          { label: '반응 추가', value: 'ADD_REACTIONS' },
          { label: '메시지 기록 읽기', value: 'READ_MESSAGE_HISTORY' }
        ]
      },
      {
        name: 'state',
        type: 'select',
        label: '권한 상태',
        required: true,
        options: [
          { label: '허용', value: 'allow' },
          { label: '거부', value: 'deny' },
          { label: '기본값', value: 'default' }
        ]
      }
    ],
    requiredPermissions: ['MANAGE_CHANNELS']
  },
  remove_channel_permission: {
    label: '채널 권한 제거',
    icon: 'ShieldOff',
    description: '특정 채널에 대한 권한 오버라이드를 제거합니다',
    parameters: [
      {
        name: 'channelId',
        type: 'select',
        label: '대상 채널',
        required: true,
        placeholder: '채널을 선택하세요'
      }
    ],
    requiredPermissions: ['MANAGE_CHANNELS']
  },
  override_channel_permission: {
    label: '채널 권한 오버라이드',
    icon: 'ShieldCheck',
    description: '채널에 대한 여러 권한을 한번에 설정합니다',
    parameters: [
      {
        name: 'channelId',
        type: 'select',
        label: '대상 채널',
        required: true,
        placeholder: '채널을 선택하세요'
      },
      {
        name: 'permissions',
        type: 'multiselect',
        label: '허용할 권한들',
        required: false,
        options: [
          { label: '채널 보기', value: 'VIEW_CHANNEL' },
          { label: '메시지 전송', value: 'SEND_MESSAGES' },
          { label: '음성 연결', value: 'CONNECT' },
          { label: '말하기', value: 'SPEAK' },
          { label: '메시지 관리', value: 'MANAGE_MESSAGES' },
          { label: '파일 첨부', value: 'ATTACH_FILES' },
          { label: '링크 임베드', value: 'EMBED_LINKS' },
          { label: '반응 추가', value: 'ADD_REACTIONS' }
        ]
      },
      {
        name: 'deniedPermissions',
        type: 'multiselect',
        label: '거부할 권한들',
        required: false,
        options: [
          { label: '채널 보기', value: 'VIEW_CHANNEL' },
          { label: '메시지 전송', value: 'SEND_MESSAGES' },
          { label: '음성 연결', value: 'CONNECT' },
          { label: '말하기', value: 'SPEAK' },
          { label: '메시지 관리', value: 'MANAGE_MESSAGES' },
          { label: '파일 첨부', value: 'ATTACH_FILES' },
          { label: '링크 임베드', value: 'EMBED_LINKS' },
          { label: '반응 추가', value: 'ADD_REACTIONS' }
        ]
      }
    ],
    requiredPermissions: ['MANAGE_CHANNELS']
  },
  reset_channel_permission: {
    label: '채널 권한 초기화',
    icon: 'RefreshCw',
    description: '채널의 모든 권한 오버라이드를 제거하고 기본값으로 되돌립니다',
    parameters: [
      {
        name: 'channelId',
        type: 'select',
        label: '대상 채널',
        required: true,
        placeholder: '채널을 선택하세요'
      }
    ],
    requiredPermissions: ['MANAGE_CHANNELS']
  },
  send_dm: {
    label: 'DM 전송',
    icon: 'Mail',
    description: '사용자에게 개인 메시지를 전송합니다',
    parameters: [
      {
        name: 'messageContent',
        type: 'string',
        label: '메시지 내용',
        required: true,
        placeholder: '전송할 메시지를 입력하세요'
      }
    ],
    requiredPermissions: []
  },
  move_voice_channel: {
    label: '음성 채널 이동',
    icon: 'ArrowRightLeft',
    description: '사용자를 다른 음성 채널로 이동시킵니다',
    parameters: [
      {
        name: 'channelId',
        type: 'select',
        label: '이동할 채널',
        required: true,
        placeholder: '음성 채널을 선택하세요'
      }
    ],
    requiredPermissions: ['MOVE_MEMBERS']
  },
  disconnect_voice: {
    label: '음성 연결 해제',
    icon: 'PhoneOff',
    description: '사용자의 음성 채널 연결을 해제합니다',
    parameters: [],
    requiredPermissions: ['MOVE_MEMBERS']
  },
  set_voice_mute: {
    label: '음성 음소거 설정',
    icon: 'MicOff',
    description: '음성 채널에서 사용자의 마이크를 음소거/해제합니다',
    parameters: [
      {
        name: 'mute',
        type: 'boolean',
        label: '음소거 상태',
        required: true,
        placeholder: '음소거(true) 또는 해제(false)'
      },
      {
        name: 'reason',
        type: 'string',
        label: '사유',
        required: false,
        placeholder: '음소거 사유를 입력하세요'
      }
    ],
    requiredPermissions: ['MUTE_MEMBERS']
  },
  set_voice_deafen: {
    label: '음성 차단 설정',
    icon: 'HeadphonesOff',
    description: '음성 채널에서 사용자의 스피커를 차단/해제합니다',
    parameters: [
      {
        name: 'deafen',
        type: 'boolean',
        label: '차단 상태',
        required: true,
        placeholder: '차단(true) 또는 해제(false)'
      },
      {
        name: 'reason',
        type: 'string',
        label: '사유',
        required: false,
        placeholder: '차단 사유를 입력하세요'
      }
    ],
    requiredPermissions: ['DEAFEN_MEMBERS']
  },
  toggle_voice_mute: {
    label: '음성 음소거 토글',
    icon: 'MicToggle',
    description: '음성 채널에서 사용자의 마이크 상태를 토글합니다',
    parameters: [
      {
        name: 'reason',
        type: 'string',
        label: '사유',
        required: false,
        placeholder: '토글 사유를 입력하세요'
      }
    ],
    requiredPermissions: ['MUTE_MEMBERS']
  },
  toggle_voice_deafen: {
    label: '음성 차단 토글',
    icon: 'HeadphonesToggle',
    description: '음성 채널에서 사용자의 스피커 상태를 토글합니다',
    parameters: [
      {
        name: 'reason',
        type: 'string',
        label: '사유',
        required: false,
        placeholder: '토글 사유를 입력하세요'
      }
    ],
    requiredPermissions: ['DEAFEN_MEMBERS']
  },
  set_priority_speaker: {
    label: '우선 발언자 설정',
    icon: 'Megaphone',
    description: '음성 채널에서 우선 발언자 권한을 설정합니다',
    parameters: [
      {
        name: 'enabled',
        type: 'boolean',
        label: '우선 발언자 상태',
        required: true,
        placeholder: '활성화(true) 또는 비활성화(false)'
      },
      {
        name: 'channelId',
        type: 'select',
        label: '대상 채널',
        required: false,
        placeholder: '특정 채널을 선택하거나 현재 채널 사용'
      }
    ],
    requiredPermissions: ['PRIORITY_SPEAKER']
  },
  remove_timeout: {
    label: '타임아웃 해제',
    icon: 'UserCheck',
    description: '사용자의 타임아웃을 해제합니다',
    parameters: [
      {
        name: 'reason',
        type: 'string',
        label: '사유',
        required: false,
        placeholder: '타임아웃 해제 사유를 입력하세요'
      }
    ],
    requiredPermissions: ['MODERATE_MEMBERS']
  }
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