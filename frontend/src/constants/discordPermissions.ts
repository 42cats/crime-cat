/**
 * Discord 권한 시스템 상수 정의
 * 비트와이즈 플래그를 사용하여 권한을 관리합니다.
 */

// 기본 권한 플래그들 (비트와이즈)
export const DISCORD_PERMISSIONS = {
  // === 관리 권한 ===
  CREATE_INSTANT_INVITE: 1n << 0n,           // 0x1
  KICK_MEMBERS: 1n << 1n,                    // 0x2
  BAN_MEMBERS: 1n << 2n,                     // 0x4
  ADMINISTRATOR: 1n << 3n,                   // 0x8
  MANAGE_CHANNELS: 1n << 4n,                 // 0x10
  MANAGE_GUILD: 1n << 5n,                    // 0x20
  ADD_REACTIONS: 1n << 6n,                   // 0x40
  VIEW_AUDIT_LOG: 1n << 7n,                  // 0x80
  PRIORITY_SPEAKER: 1n << 8n,                // 0x100
  STREAM: 1n << 9n,                          // 0x200
  VIEW_CHANNEL: 1n << 10n,                   // 0x400
  SEND_MESSAGES: 1n << 11n,                  // 0x800
  SEND_TTS_MESSAGES: 1n << 12n,              // 0x1000
  MANAGE_MESSAGES: 1n << 13n,                // 0x2000
  EMBED_LINKS: 1n << 14n,                    // 0x4000
  ATTACH_FILES: 1n << 15n,                   // 0x8000
  READ_MESSAGE_HISTORY: 1n << 16n,           // 0x10000
  MENTION_EVERYONE: 1n << 17n,               // 0x20000
  USE_EXTERNAL_EMOJIS: 1n << 18n,            // 0x40000
  VIEW_GUILD_INSIGHTS: 1n << 19n,            // 0x80000
  CONNECT: 1n << 20n,                        // 0x100000
  SPEAK: 1n << 21n,                          // 0x200000
  MUTE_MEMBERS: 1n << 22n,                   // 0x400000
  DEAFEN_MEMBERS: 1n << 23n,                 // 0x800000
  MOVE_MEMBERS: 1n << 24n,                   // 0x1000000
  USE_VAD: 1n << 25n,                        // 0x2000000
  CHANGE_NICKNAME: 1n << 26n,                // 0x4000000
  MANAGE_NICKNAMES: 1n << 27n,               // 0x8000000
  MANAGE_ROLES: 1n << 28n,                   // 0x10000000
  MANAGE_WEBHOOKS: 1n << 29n,                // 0x20000000
  MANAGE_GUILD_EXPRESSIONS: 1n << 30n,       // 0x40000000
  USE_APPLICATION_COMMANDS: 1n << 31n,       // 0x80000000
  REQUEST_TO_SPEAK: 1n << 32n,               // 0x100000000
  MANAGE_EVENTS: 1n << 33n,                  // 0x200000000
  MANAGE_THREADS: 1n << 34n,                 // 0x400000000
  CREATE_PUBLIC_THREADS: 1n << 35n,          // 0x800000000
  CREATE_PRIVATE_THREADS: 1n << 36n,         // 0x1000000000
  USE_EXTERNAL_STICKERS: 1n << 37n,          // 0x2000000000
  SEND_MESSAGES_IN_THREADS: 1n << 38n,       // 0x4000000000
  USE_EMBEDDED_ACTIVITIES: 1n << 39n,        // 0x8000000000
  MODERATE_MEMBERS: 1n << 40n,               // 0x10000000000
  VIEW_CREATOR_MONETIZATION_ANALYTICS: 1n << 41n, // 0x20000000000
  USE_SOUNDBOARD: 1n << 42n,                 // 0x40000000000
  CREATE_GUILD_EXPRESSIONS: 1n << 43n,       // 0x80000000000
  CREATE_EVENTS: 1n << 44n,                  // 0x100000000000
  USE_EXTERNAL_SOUNDS: 1n << 45n,            // 0x200000000000
  SEND_VOICE_MESSAGES: 1n << 46n,            // 0x400000000000
  SEND_POLLS: 1n << 49n,                     // 0x2000000000000
  USE_EXTERNAL_APPS: 1n << 50n,              // 0x4000000000000
} as const;

// 권한별 한국어 설명 및 메타데이터
export const PERMISSION_INFO = {
  // === 서버 관리 권한 ===
  CREATE_INSTANT_INVITE: {
    name: '초대 링크 생성',
    description: '서버 초대 링크를 생성할 수 있습니다',
    category: 'server_management',
    scope: ['server', 'channel']
  },
  MANAGE_GUILD: {
    name: '서버 관리',
    description: '서버 이름, 지역, 아이콘 등을 변경할 수 있습니다',
    category: 'server_management',
    scope: ['server']
  },
  MANAGE_CHANNELS: {
    name: '채널 관리',
    description: '채널을 생성, 편집, 삭제할 수 있습니다',
    category: 'server_management',
    scope: ['server', 'channel']
  },
  MANAGE_ROLES: {
    name: '역할 관리',
    description: '역할을 생성, 편집, 삭제하고 멤버에게 부여할 수 있습니다',
    category: 'server_management',
    scope: ['server']
  },
  MANAGE_WEBHOOKS: {
    name: '웹훅 관리',
    description: '웹훅을 생성, 편집, 삭제할 수 있습니다',
    category: 'server_management',
    scope: ['server', 'channel']
  },
  ADMINISTRATOR: {
    name: '관리자',
    description: '모든 권한을 가지며 채널 권한을 무시합니다',
    category: 'admin',
    scope: ['server']
  },

  // === 멤버 관리 권한 ===
  KICK_MEMBERS: {
    name: '멤버 추방',
    description: '멤버를 서버에서 추방할 수 있습니다',
    category: 'member_management',
    scope: ['server']
  },
  BAN_MEMBERS: {
    name: '멤버 차단',
    description: '멤버를 서버에서 차단할 수 있습니다',
    category: 'member_management',
    scope: ['server']
  },
  MODERATE_MEMBERS: {
    name: '멤버 조정',
    description: '멤버를 타임아웃 시킬 수 있습니다',
    category: 'member_management',
    scope: ['server']
  },
  MANAGE_NICKNAMES: {
    name: '닉네임 관리',
    description: '다른 멤버의 닉네임을 변경할 수 있습니다',
    category: 'member_management',
    scope: ['server']
  },
  CHANGE_NICKNAME: {
    name: '닉네임 변경',
    description: '자신의 닉네임을 변경할 수 있습니다',
    category: 'member_management',
    scope: ['server']
  },

  // === 텍스트 채널 권한 ===
  VIEW_CHANNEL: {
    name: '채널 보기',
    description: '채널을 보고 읽을 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  SEND_MESSAGES: {
    name: '메시지 보내기',
    description: '채널에 메시지를 보낼 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  SEND_TTS_MESSAGES: {
    name: 'TTS 메시지 보내기',
    description: '텍스트 음성 변환 메시지를 보낼 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  MANAGE_MESSAGES: {
    name: '메시지 관리',
    description: '다른 사람의 메시지를 삭제하고 핀을 설정할 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  EMBED_LINKS: {
    name: '링크 임베드',
    description: '링크를 자동으로 미리보기로 표시할 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  ATTACH_FILES: {
    name: '파일 첨부',
    description: '메시지에 파일을 첨부할 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  READ_MESSAGE_HISTORY: {
    name: '메시지 기록 읽기',
    description: '이전 메시지를 읽을 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  MENTION_EVERYONE: {
    name: '@everyone 멘션',
    description: '@everyone과 @here를 사용할 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  USE_EXTERNAL_EMOJIS: {
    name: '외부 이모지 사용',
    description: '다른 서버의 이모지를 사용할 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  USE_EXTERNAL_STICKERS: {
    name: '외부 스티커 사용',
    description: '다른 서버의 스티커를 사용할 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  ADD_REACTIONS: {
    name: '반응 추가',
    description: '메시지에 이모지 반응을 추가할 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  SEND_VOICE_MESSAGES: {
    name: '음성 메시지 보내기',
    description: '음성 메시지를 보낼 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },
  SEND_POLLS: {
    name: '투표 보내기',
    description: '투표를 생성할 수 있습니다',
    category: 'text_channel',
    scope: ['channel']
  },

  // === 음성 채널 권한 ===
  CONNECT: {
    name: '연결',
    description: '음성 채널에 연결할 수 있습니다',
    category: 'voice_channel',
    scope: ['channel']
  },
  SPEAK: {
    name: '말하기',
    description: '음성 채널에서 말할 수 있습니다',
    category: 'voice_channel',
    scope: ['channel']
  },
  STREAM: {
    name: '화면 공유',
    description: '음성 채널에서 화면을 공유할 수 있습니다',
    category: 'voice_channel',
    scope: ['channel']
  },
  MUTE_MEMBERS: {
    name: '멤버 음소거',
    description: '다른 멤버의 마이크를 음소거시킬 수 있습니다',
    category: 'voice_channel',
    scope: ['channel']
  },
  DEAFEN_MEMBERS: {
    name: '멤버 스피커 차단',
    description: '다른 멤버의 스피커를 차단할 수 있습니다',
    category: 'voice_channel',
    scope: ['channel']
  },
  MOVE_MEMBERS: {
    name: '멤버 이동',
    description: '멤버를 다른 음성 채널로 이동시킬 수 있습니다',
    category: 'voice_channel',
    scope: ['channel']
  },
  USE_VAD: {
    name: '음성 활동 감지 사용',
    description: '푸시 투 토크 없이 말할 수 있습니다',
    category: 'voice_channel',
    scope: ['channel']
  },
  PRIORITY_SPEAKER: {
    name: '우선 발언자',
    description: '우선 발언자로 설정되면 다른 사람보다 큰 소리로 들립니다',
    category: 'voice_channel',
    scope: ['channel']
  },
  USE_EMBEDDED_ACTIVITIES: {
    name: '활동 사용',
    description: '음성 채널에서 활동(게임 등)을 시작할 수 있습니다',
    category: 'voice_channel',
    scope: ['channel']
  },
  USE_SOUNDBOARD: {
    name: '사운드보드 사용',
    description: '사운드보드를 사용할 수 있습니다',
    category: 'voice_channel',
    scope: ['channel']
  },
  USE_EXTERNAL_SOUNDS: {
    name: '외부 사운드 사용',
    description: '다른 서버의 사운드를 사용할 수 있습니다',
    category: 'voice_channel',
    scope: ['channel']
  },

  // === 스레드 권한 ===
  CREATE_PUBLIC_THREADS: {
    name: '공개 스레드 생성',
    description: '공개 스레드를 생성할 수 있습니다',
    category: 'threads',
    scope: ['channel']
  },
  CREATE_PRIVATE_THREADS: {
    name: '비공개 스레드 생성',
    description: '비공개 스레드를 생성할 수 있습니다',
    category: 'threads',
    scope: ['channel']
  },
  SEND_MESSAGES_IN_THREADS: {
    name: '스레드에서 메시지 보내기',
    description: '스레드에서 메시지를 보낼 수 있습니다',
    category: 'threads',
    scope: ['channel']
  },
  MANAGE_THREADS: {
    name: '스레드 관리',
    description: '스레드를 삭제하고 보관할 수 있습니다',
    category: 'threads',
    scope: ['channel']
  },

  // === 이벤트 권한 ===
  CREATE_EVENTS: {
    name: '이벤트 생성',
    description: '이벤트를 생성할 수 있습니다',
    category: 'events',
    scope: ['server']
  },
  MANAGE_EVENTS: {
    name: '이벤트 관리',
    description: '이벤트를 편집하고 삭제할 수 있습니다',
    category: 'events',
    scope: ['server']
  },

  // === 기타 권한 ===
  USE_APPLICATION_COMMANDS: {
    name: '슬래시 커맨드 사용',
    description: '슬래시 커맨드를 사용할 수 있습니다',
    category: 'misc',
    scope: ['channel']
  },
  REQUEST_TO_SPEAK: {
    name: '발언 요청',
    description: '스테이지 채널에서 발언을 요청할 수 있습니다',
    category: 'misc',
    scope: ['channel']
  },
  MANAGE_GUILD_EXPRESSIONS: {
    name: '서버 표현 관리',
    description: '서버의 이모지와 스티커를 관리할 수 있습니다',
    category: 'misc',
    scope: ['server']
  },
  CREATE_GUILD_EXPRESSIONS: {
    name: '서버 표현 생성',
    description: '서버에 이모지와 스티커를 추가할 수 있습니다',
    category: 'misc',
    scope: ['server']
  },
  VIEW_AUDIT_LOG: {
    name: '감사 로그 보기',
    description: '서버의 감사 로그를 볼 수 있습니다',
    category: 'misc',
    scope: ['server']
  },
  VIEW_GUILD_INSIGHTS: {
    name: '서버 인사이트 보기',
    description: '서버 인사이트를 볼 수 있습니다',
    category: 'misc',
    scope: ['server']
  },
  VIEW_CREATOR_MONETIZATION_ANALYTICS: {
    name: '크리에이터 수익화 분석 보기',
    description: '크리에이터 수익화 분석을 볼 수 있습니다',
    category: 'misc',
    scope: ['server']
  },
  USE_EXTERNAL_APPS: {
    name: '외부 앱 사용',
    description: '외부 앱을 사용할 수 있습니다',
    category: 'misc',
    scope: ['channel']
  }
} as const;

// 권한 카테고리별 그룹핑
export const PERMISSION_CATEGORIES = {
  admin: {
    name: '관리자',
    icon: '👑',
    color: '#ff0000',
    permissions: ['ADMINISTRATOR']
  },
  server_management: {
    name: '서버 관리',
    icon: '⚙️',
    color: '#5865f2',
    permissions: [
      'MANAGE_GUILD', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 
      'MANAGE_WEBHOOKS', 'CREATE_INSTANT_INVITE'
    ]
  },
  member_management: {
    name: '멤버 관리',
    icon: '👥',
    color: '#57f287',
    permissions: [
      'KICK_MEMBERS', 'BAN_MEMBERS', 'MODERATE_MEMBERS', 
      'MANAGE_NICKNAMES', 'CHANGE_NICKNAME'
    ]
  },
  text_channel: {
    name: '텍스트 채널',
    icon: '💬',
    color: '#3ba55c',
    permissions: [
      'VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 
      'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 
      'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE', 'USE_EXTERNAL_EMOJIS',
      'USE_EXTERNAL_STICKERS', 'ADD_REACTIONS', 'SEND_VOICE_MESSAGES', 'SEND_POLLS'
    ]
  },
  voice_channel: {
    name: '음성 채널',
    icon: '🔊',
    color: '#f23c50',
    permissions: [
      'CONNECT', 'SPEAK', 'STREAM', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS',
      'MOVE_MEMBERS', 'USE_VAD', 'PRIORITY_SPEAKER', 'USE_EMBEDDED_ACTIVITIES',
      'USE_SOUNDBOARD', 'USE_EXTERNAL_SOUNDS'
    ]
  },
  threads: {
    name: '스레드',
    icon: '🧵',
    color: '#fee75c',
    permissions: [
      'CREATE_PUBLIC_THREADS', 'CREATE_PRIVATE_THREADS', 
      'SEND_MESSAGES_IN_THREADS', 'MANAGE_THREADS'
    ]
  },
  events: {
    name: '이벤트',
    icon: '📅',
    color: '#eb459e',
    permissions: ['CREATE_EVENTS', 'MANAGE_EVENTS']
  },
  misc: {
    name: '기타',
    icon: '🔧',
    color: '#95a5a6',
    permissions: [
      'USE_APPLICATION_COMMANDS', 'REQUEST_TO_SPEAK', 'MANAGE_GUILD_EXPRESSIONS',
      'CREATE_GUILD_EXPRESSIONS', 'VIEW_AUDIT_LOG', 'VIEW_GUILD_INSIGHTS',
      'VIEW_CREATOR_MONETIZATION_ANALYTICS', 'USE_EXTERNAL_APPS'
    ]
  }
} as const;

// 채널 타입별 적용 가능한 권한들
export const CHANNEL_TYPE_PERMISSIONS = {
  text: [
    'VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES',
    'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE',
    'USE_EXTERNAL_EMOJIS', 'USE_EXTERNAL_STICKERS', 'ADD_REACTIONS',
    'CREATE_PUBLIC_THREADS', 'CREATE_PRIVATE_THREADS', 'SEND_MESSAGES_IN_THREADS',
    'MANAGE_THREADS', 'USE_APPLICATION_COMMANDS', 'SEND_VOICE_MESSAGES', 'SEND_POLLS'
  ],
  voice: [
    'VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS',
    'MOVE_MEMBERS', 'USE_VAD', 'PRIORITY_SPEAKER', 'USE_EMBEDDED_ACTIVITIES',
    'USE_SOUNDBOARD', 'USE_EXTERNAL_SOUNDS', 'REQUEST_TO_SPEAK'
  ],
  category: [
    'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'CREATE_INSTANT_INVITE'
  ],
  announcement: [
    'VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS',
    'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE',
    'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS', 'USE_APPLICATION_COMMANDS'
  ]
} as const;

// 유틸리티 함수들
export const PermissionUtils = {
  /**
   * 권한 이름을 한국어로 변환
   */
  getPermissionName: (permission: keyof typeof PERMISSION_INFO): string => {
    return PERMISSION_INFO[permission]?.name || permission;
  },

  /**
   * 권한 설명을 가져오기
   */
  getPermissionDescription: (permission: keyof typeof PERMISSION_INFO): string => {
    return PERMISSION_INFO[permission]?.description || '';
  },

  /**
   * 카테고리별 권한 목록 가져오기
   */
  getPermissionsByCategory: (category: keyof typeof PERMISSION_CATEGORIES) => {
    return PERMISSION_CATEGORIES[category]?.permissions || [];
  },

  /**
   * 채널 타입별 권한 목록 가져오기
   */
  getPermissionsByChannelType: (channelType: keyof typeof CHANNEL_TYPE_PERMISSIONS) => {
    return CHANNEL_TYPE_PERMISSIONS[channelType] || [];
  },

  /**
   * 권한이 특정 범위에 적용되는지 확인
   */
  isPermissionApplicableToScope: (permission: keyof typeof PERMISSION_INFO, scope: 'server' | 'channel'): boolean => {
    return PERMISSION_INFO[permission]?.scope.includes(scope) || false;
  }
};