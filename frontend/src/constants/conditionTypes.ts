// 조건 타입 정의
export const CONDITION_TYPES = {
  role_required: {
    label: '필수 역할',
    description: '사용자가 이 역할들 중 하나 이상을 가져야 합니다',
    icon: '✅',
    type: 'array'
  },
  role_denied: {
    label: '차단 역할',
    description: '사용자가 이 역할들을 가지고 있으면 사용할 수 없습니다',
    icon: '❌',
    type: 'array'
  },
  channel_required: {
    label: '특정 채널에서만',
    description: '지정된 채널에서만 버튼을 사용할 수 있습니다',
    icon: '📍',
    type: 'single'
  },
  cooldown: {
    label: '쿨다운',
    description: '버튼 사용 후 재사용까지의 대기시간',
    icon: '⏰',
    type: 'number'
  },
  user_limit: {
    label: '사용 제한',
    description: '사용자당 사용 횟수 제한',
    icon: '🔢',
    type: 'number'
  },
  time_window: {
    label: '시간 제한',
    description: '특정 시간대에만 사용 가능',
    icon: '🕐',
    type: 'time'
  }
} as const;