// 액션 타입 정의
export const ACTION_TYPES = {
  // 역할 관리
  add_role: {
    label: '역할 추가',
    icon: '👥',
    description: '사용자에게 역할을 추가합니다',
    parameters: ['roleId'],
    requiredPermissions: ['MANAGE_ROLES']
  },
  remove_role: {
    label: '역할 제거',
    icon: '👤',
    description: '사용자의 역할을 제거합니다',
    parameters: ['roleId'],
    requiredPermissions: ['MANAGE_ROLES']
  },
  toggle_role: {
    label: '역할 토글',
    icon: '🔄',
    description: '역할이 있으면 제거, 없으면 추가합니다',
    parameters: ['roleId'],
    requiredPermissions: ['MANAGE_ROLES']
  },
  
  // 닉네임 관리
  change_nickname: {
    label: '닉네임 변경',
    icon: '✏️',
    description: '사용자의 닉네임을 변경합니다',
    parameters: ['nickname'],
    requiredPermissions: ['MANAGE_NICKNAMES']
  },
  reset_nickname: {
    label: '닉네임 초기화',
    icon: '🔄',
    description: '사용자의 닉네임을 원래대로 복원합니다',
    parameters: [],
    requiredPermissions: ['MANAGE_NICKNAMES']
  },
  
  // 메시지 관리
  send_message: {
    label: '메시지 전송',
    icon: '💬',
    description: '지정된 채널에 메시지를 전송합니다',
    parameters: ['channelId', 'message'],
    requiredPermissions: ['SEND_MESSAGES']
  },
  send_dm: {
    label: 'DM 전송',
    icon: '📨',
    description: '사용자에게 개인 메시지를 전송합니다',
    parameters: ['message'],
    requiredPermissions: []
  },
  
  // 음성 채널 관리
  move_voice_channel: {
    label: '음성 채널 이동',
    icon: '🎵',
    description: '사용자를 다른 음성 채널로 이동시킵니다',
    parameters: ['channelId'],
    requiredPermissions: ['MOVE_MEMBERS']
  },
  disconnect_voice: {
    label: '음성 채널 연결 해제',
    icon: '🔇',
    description: '사용자를 음성 채널에서 연결 해제합니다',
    parameters: [],
    requiredPermissions: ['MOVE_MEMBERS']
  },
  
  // 음성 제어
  set_voice_mute: {
    label: '마이크 음소거',
    icon: '🔇',
    description: '사용자의 마이크를 음소거합니다',
    parameters: ['duration'],
    requiredPermissions: ['MUTE_MEMBERS']
  },
  set_voice_deafen: {
    label: '스피커 차단',
    icon: '🔊',
    description: '사용자의 스피커를 차단합니다',
    parameters: ['duration'],
    requiredPermissions: ['DEAFEN_MEMBERS']
  },
  toggle_voice_mute: {
    label: '마이크 토글',
    icon: '🎙️',
    description: '마이크 상태를 토글합니다',
    parameters: [],
    requiredPermissions: ['MUTE_MEMBERS']
  },
  toggle_voice_deafen: {
    label: '스피커 토글',
    icon: '🔊',
    description: '스피커 상태를 토글합니다',
    parameters: [],
    requiredPermissions: ['DEAFEN_MEMBERS']
  },
  set_priority_speaker: {
    label: '우선 발언자 설정',
    icon: '🎯',
    description: '우선 발언자 권한을 설정합니다',
    parameters: ['enable'],
    requiredPermissions: ['PRIORITY_SPEAKER']
  },
  
  // 채널 권한 관리
  set_channel_permission: {
    label: '채널 권한 설정',
    icon: '🔐',
    description: '특정 채널의 권한을 설정합니다',
    parameters: ['channelId', 'permissions'],
    requiredPermissions: ['MANAGE_CHANNELS']
  },
  remove_channel_permission: {
    label: '채널 권한 제거',
    icon: '🚫',
    description: '채널의 권한 오버라이드를 제거합니다',
    parameters: ['channelId', 'permissions'],
    requiredPermissions: ['MANAGE_CHANNELS']
  },
  
  // 서버 권한 관리
  grant_server_permission: {
    label: '서버 권한 부여',
    icon: '🔑',
    description: '사용자에게 서버 권한을 부여합니다',
    parameters: ['permissions'],
    requiredPermissions: ['MANAGE_ROLES']
  },
  revoke_server_permission: {
    label: '서버 권한 제거',
    icon: '🚫',
    description: '사용자의 서버 권한을 제거합니다',
    parameters: ['permissions'],
    requiredPermissions: ['MANAGE_ROLES']
  },
  
  // 기타
  remove_timeout: {
    label: '타임아웃 해제',
    icon: '⏰',
    description: '사용자의 타임아웃을 해제합니다',
    parameters: [],
    requiredPermissions: ['MODERATE_MEMBERS']
  },
  
  // 음악 관리
  play_music: {
    label: '음악 재생',
    icon: '🎵',
    description: '선택한 음악을 재생합니다',
    parameters: ['source', 'trackId', 'trackTitle', 'duration', 'stopBehavior', 'volume'],
    requiredPermissions: ['CONNECT', 'SPEAK'],
    category: 'music'
  },
  stop_music: {
    label: '음악 정지',
    icon: '⏹️',
    description: '현재 재생 중인 음악을 정지합니다',
    parameters: [],
    requiredPermissions: ['CONNECT', 'SPEAK'],
    category: 'music'
  },
  pause_music: {
    label: '음악 일시정지/재개',
    icon: '⏸️',
    description: '현재 재생 중인 음악을 일시정지하거나 재개합니다',
    parameters: [],
    requiredPermissions: ['CONNECT', 'SPEAK'],
    category: 'music'
  }
} as const;