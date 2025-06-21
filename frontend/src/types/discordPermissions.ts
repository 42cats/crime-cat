// Discord 권한 비트필드 정의
// 참고: https://discord.com/developers/docs/topics/permissions

export const DiscordPermissions = {
  // 일반 권한
  CREATE_INSTANT_INVITE: 0x1, // 1
  KICK_MEMBERS: 0x2, // 2
  BAN_MEMBERS: 0x4, // 4
  ADMINISTRATOR: 0x8, // 8
  MANAGE_CHANNELS: 0x10, // 16
  MANAGE_GUILD: 0x20, // 32
  ADD_REACTIONS: 0x40, // 64
  VIEW_AUDIT_LOG: 0x80, // 128
  PRIORITY_SPEAKER: 0x100, // 256
  STREAM: 0x200, // 512
  VIEW_CHANNEL: 0x400, // 1024
  SEND_MESSAGES: 0x800, // 2048
  SEND_TTS_MESSAGES: 0x1000, // 4096
  MANAGE_MESSAGES: 0x2000, // 8192
  EMBED_LINKS: 0x4000, // 16384
  ATTACH_FILES: 0x8000, // 32768
  READ_MESSAGE_HISTORY: 0x10000, // 65536
  MENTION_EVERYONE: 0x20000, // 131072
  USE_EXTERNAL_EMOJIS: 0x40000, // 262144
  VIEW_GUILD_INSIGHTS: 0x80000, // 524288
  CONNECT: 0x100000, // 1048576
  SPEAK: 0x200000, // 2097152
  MUTE_MEMBERS: 0x400000, // 4194304
  DEAFEN_MEMBERS: 0x800000, // 8388608
  MOVE_MEMBERS: 0x1000000, // 16777216
  USE_VAD: 0x2000000, // 33554432
  CHANGE_NICKNAME: 0x4000000, // 67108864
  MANAGE_NICKNAMES: 0x8000000, // 134217728
  MANAGE_ROLES: 0x10000000, // 268435456
  MANAGE_WEBHOOKS: 0x20000000, // 536870912
  MANAGE_EMOJIS_AND_STICKERS: 0x40000000, // 1073741824
  USE_APPLICATION_COMMANDS: 0x80000000, // 2147483648
  REQUEST_TO_SPEAK: 0x100000000, // 4294967296
  MANAGE_EVENTS: 0x200000000, // 8589934592
  MANAGE_THREADS: 0x400000000, // 17179869184
  CREATE_PUBLIC_THREADS: 0x800000000, // 34359738368
  CREATE_PRIVATE_THREADS: 0x1000000000, // 68719476736
  USE_EXTERNAL_STICKERS: 0x2000000000, // 137438953472
  SEND_MESSAGES_IN_THREADS: 0x4000000000, // 274877906944
  USE_EMBEDDED_ACTIVITIES: 0x8000000000, // 549755813888
  MODERATE_MEMBERS: 0x10000000000, // 1099511627776
} as const;

// 권한 이름 매핑
export const PermissionNames: Record<keyof typeof DiscordPermissions, string> = {
  CREATE_INSTANT_INVITE: '초대 생성',
  KICK_MEMBERS: '멤버 추방',
  BAN_MEMBERS: '멤버 차단',
  ADMINISTRATOR: '관리자',
  MANAGE_CHANNELS: '채널 관리',
  MANAGE_GUILD: '서버 관리',
  ADD_REACTIONS: '반응 추가',
  VIEW_AUDIT_LOG: '감사 로그 보기',
  PRIORITY_SPEAKER: '우선 발언자',
  STREAM: '화면 공유',
  VIEW_CHANNEL: '채널 보기',
  SEND_MESSAGES: '메시지 전송',
  SEND_TTS_MESSAGES: 'TTS 메시지 전송',
  MANAGE_MESSAGES: '메시지 관리',
  EMBED_LINKS: '링크 임베드',
  ATTACH_FILES: '파일 첨부',
  READ_MESSAGE_HISTORY: '메시지 기록 읽기',
  MENTION_EVERYONE: '@everyone 멘션',
  USE_EXTERNAL_EMOJIS: '외부 이모지 사용',
  VIEW_GUILD_INSIGHTS: '서버 인사이트 보기',
  CONNECT: '연결',
  SPEAK: '말하기',
  MUTE_MEMBERS: '멤버 음소거',
  DEAFEN_MEMBERS: '멤버 스피커 차단',
  MOVE_MEMBERS: '멤버 이동',
  USE_VAD: '음성 감지 사용',
  CHANGE_NICKNAME: '닉네임 변경',
  MANAGE_NICKNAMES: '닉네임 관리',
  MANAGE_ROLES: '역할 관리',
  MANAGE_WEBHOOKS: '웹훅 관리',
  MANAGE_EMOJIS_AND_STICKERS: '이모지 및 스티커 관리',
  USE_APPLICATION_COMMANDS: '애플리케이션 명령 사용',
  REQUEST_TO_SPEAK: '발언 요청',
  MANAGE_EVENTS: '이벤트 관리',
  MANAGE_THREADS: '스레드 관리',
  CREATE_PUBLIC_THREADS: '공개 스레드 생성',
  CREATE_PRIVATE_THREADS: '비공개 스레드 생성',
  USE_EXTERNAL_STICKERS: '외부 스티커 사용',
  SEND_MESSAGES_IN_THREADS: '스레드에 메시지 전송',
  USE_EMBEDDED_ACTIVITIES: '임베디드 활동 사용',
  MODERATE_MEMBERS: '멤버 중재',
};

// 텍스트 채널 전용 권한
export const TextChannelPermissions = [
  'VIEW_CHANNEL',
  'SEND_MESSAGES',
  'SEND_TTS_MESSAGES',
  'MANAGE_MESSAGES',
  'EMBED_LINKS',
  'ATTACH_FILES',
  'READ_MESSAGE_HISTORY',
  'MENTION_EVERYONE',
  'USE_EXTERNAL_EMOJIS',
  'ADD_REACTIONS',
  'MANAGE_THREADS',
  'CREATE_PUBLIC_THREADS',
  'CREATE_PRIVATE_THREADS',
  'SEND_MESSAGES_IN_THREADS',
  'USE_EXTERNAL_STICKERS',
] as const;

// 음성 채널 전용 권한
export const VoiceChannelPermissions = [
  'VIEW_CHANNEL',
  'CONNECT',
  'SPEAK',
  'MUTE_MEMBERS',
  'DEAFEN_MEMBERS',
  'MOVE_MEMBERS',
  'USE_VAD',
  'PRIORITY_SPEAKER',
  'STREAM',
  'USE_EMBEDDED_ACTIVITIES',
  'REQUEST_TO_SPEAK',
] as const;

// 권한 카테고리
export const PermissionCategories = {
  GENERAL: [
    'VIEW_CHANNEL',
    'MANAGE_CHANNELS',
    'MANAGE_ROLES',
    'CREATE_INSTANT_INVITE',
    'MANAGE_WEBHOOKS',
  ],
  TEXT: [
    'SEND_MESSAGES',
    'SEND_TTS_MESSAGES',
    'MANAGE_MESSAGES',
    'EMBED_LINKS',
    'ATTACH_FILES',
    'READ_MESSAGE_HISTORY',
    'MENTION_EVERYONE',
    'USE_EXTERNAL_EMOJIS',
    'USE_EXTERNAL_STICKERS',
    'ADD_REACTIONS',
  ],
  VOICE: [
    'CONNECT',
    'SPEAK',
    'STREAM',
    'USE_VAD',
    'PRIORITY_SPEAKER',
    'REQUEST_TO_SPEAK',
    'USE_EMBEDDED_ACTIVITIES',
  ],
  THREAD: [
    'MANAGE_THREADS',
    'CREATE_PUBLIC_THREADS',
    'CREATE_PRIVATE_THREADS',
    'SEND_MESSAGES_IN_THREADS',
  ],
  MODERATION: [
    'KICK_MEMBERS',
    'BAN_MEMBERS',
    'MUTE_MEMBERS',
    'DEAFEN_MEMBERS',
    'MOVE_MEMBERS',
    'MODERATE_MEMBERS',
    'MANAGE_NICKNAMES',
  ],
  ADVANCED: [
    'ADMINISTRATOR',
    'MANAGE_GUILD',
    'VIEW_AUDIT_LOG',
    'VIEW_GUILD_INSIGHTS',
    'MANAGE_EVENTS',
    'MANAGE_EMOJIS_AND_STICKERS',
  ],
} as const;

// 권한 계산 헬퍼 함수
export function hasPermission(permissions: bigint, permission: keyof typeof DiscordPermissions): boolean {
  return (permissions & BigInt(DiscordPermissions[permission])) === BigInt(DiscordPermissions[permission]);
}

export function addPermission(permissions: bigint, permission: keyof typeof DiscordPermissions): bigint {
  return permissions | BigInt(DiscordPermissions[permission]);
}

export function removePermission(permissions: bigint, permission: keyof typeof DiscordPermissions): bigint {
  return permissions & ~BigInt(DiscordPermissions[permission]);
}

export function calculatePermissions(allow: bigint, deny: bigint): bigint {
  return allow & ~deny;
}