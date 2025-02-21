    	const guildId = interaction.guildId;
    	const guildId = message.guildId;

    	const client = interaction.client;
    	const client = message.client;

    	const channelId = message.channelId;
    	const channelId = interaction.channelId;

`ChatInputCommandInteraction` 객체는 Discord.js에서 슬래시 명령어와 관련된 인터랙션을 나타냅니다. 제공된 로그를 기반으로 접근 가능한 주요 프로퍼티들을 정리하겠습니다:

---

### 주요 프로퍼티 목록

#### 1. **기본 정보**

-   **`type`**: 인터랙션의 타입 (`2`은 슬래시 명령어를 나타냄).
-   **`id`**: 인터랙션의 고유 ID.
-   **`applicationId`**: 봇 애플리케이션의 ID.
-   **`channelId`**: 인터랙션이 발생한 채널의 ID.
-   **`guildId`**: 인터랙션이 발생한 길드의 ID.

#### 2. **사용자 정보**

-   **`user`**: 명령어를 실행한 사용자 정보를 담은 객체.
    -   **`id`**: 사용자의 고유 ID.
    -   **`username`**: 사용자의 이름.
    -   **`globalName`**: 사용자의 글로벌 이름.
    -   **`discriminator`**: 태그 번호.
    -   **`avatar`**: 사용자의 아바타 해시.
    -   **`bot`**: 사용자가 봇인지 여부.

#### 3. **길드 멤버 정보 (`member`)**

-   **`member`**: 길드 내에서의 멤버 정보.
    -   **`guild`**: 길드 정보 객체.
        -   **`id`**: 길드 ID.
        -   **`name`**: 길드 이름.
        -   **`memberCount`**: 길드의 멤버 수.
        -   **`ownerId`**: 길드 소유자의 ID.
    -   **`nickname`**: 멤버의 닉네임 (없을 경우 `null`).
    -   **`user`**: 길드 멤버와 연결된 사용자 정보 (`user`와 동일).
    -   **`joinedTimestamp`**: 길드에 가입한 시각의 타임스탬프.
    -   **`communicationDisabledUntilTimestamp`**: 멤버가 뮤트된 시간 (없으면 `null`).

#### 4. **권한 정보**

-   **`appPermissions`**: 봇의 애플리케이션 권한.
-   **`memberPermissions`**: 명령어를 실행한 사용자의 권한.

#### 5. **지역 설정**

-   **`locale`**: 사용자의 언어 설정 (예: `ko`).
-   **`guildLocale`**: 길드의 언어 설정 (예: `en-US`).

#### 6. **명령어 관련 정보**

-   **`commandId`**: 명령어의 ID.
-   **`commandName`**: 실행된 명령어의 이름 (예: `청소`).
-   **`commandType`**: 명령어 타입 (예: `1`은 기본 명령어).

#### 7. **응답 상태**

-   **`deferred`**: 응답이 연기되었는지 여부.
-   **`replied`**: 이미 응답되었는지 여부.
-   **`ephemeral`**: 응답이 잠시 동안만 표시되도록 설정되었는지 여부.

#### 8. **옵션**

-   **`options`**: 명령어 옵션 정보를 포함하는 객체.
    -   **`_group`**: 옵션 그룹 (없으면 `null`).
    -   **`_subcommand`**: 서브 명령어 (없으면 `null`).
    -   **`_hoistedOptions`**: 명령어 옵션 배열.

#### 9. **웹훅**

-   **`webhook`**: 인터랙션과 연결된 웹훅 객체.

#### 10. **추가 정보**

-   **`entitlements`**: 엔타이틀먼트 정보 (현재 비어 있음).
-   **`authorizingIntegrationOwners`**: 인가된 통합 소유자.

---

### 요약된 구조 예시

```javascript
{
  type,
  id,
  applicationId,
  channelId,
  guildId,
  user: {
    id,
    bot,
    system,
    username,
    globalName,
    discriminator,
    avatar
  },
  member: {
    guild: {
      id,
      name,
      memberCount,
      ownerId
    },
    nickname,
    user,
    joinedTimestamp,
    communicationDisabledUntilTimestamp
  },
  appPermissions,
  memberPermissions,
  locale,
  guildLocale,
  commandId,
  commandName,
  commandType,
  deferred,
  replied,
  ephemeral,
  options: {
    _group,
    _subcommand,
    _hoistedOptions
  },
  webhook
}
```

{
// 메시지 기본 정보
channelId, // 메시지가 전송된 채널 ID
guildId, // 메시지가 전송된 길드 ID
id, // 메시지의 고유 ID
createdTimestamp, // 메시지가 생성된 타임스탬프 (밀리초 단위)
type, // 메시지 유형 (0: 기본 메시지)
system, // 시스템 메시지 여부 (true/false)
content, // 메시지 내용

// 작성자 정보
author: {
id, // 작성자의 고유 ID
bot, // 작성자가 봇인지 여부 (true/false)
system, // 작성자가 시스템 계정인지 여부
username, // 작성자의 사용자명
globalName, // 작성자의 글로벌 이름
discriminator, // 사용자 태그 (예: "1234")
avatar, // 작성자의 아바타 해시
banner, // 작성자의 배너 (없으면 undefined)
accentColor, // 작성자의 강조 색상 (없으면 undefined)
avatarDecoration, // 아바타 장식 (없으면 null)
avatarDecorationData // 아바타 장식 데이터 (없으면 null)
},

// 메시지 추가 정보
pinned, // 메시지가 고정되었는지 여부
tts, // 텍스트-투-스피치 메시지 여부
nonce, // 메시지의 고유 식별자
embeds, // 메시지에 포함된 임베드 배열
components, // 메시지에 포함된 상호작용 컴포넌트 배열
attachments, // 첨부된 파일들의 컬렉션
stickers, // 메시지에 포함된 스티커들의 컬렉션
position, // 메시지의 위치 (null일 가능성 있음)
roleSubscriptionData, // 역할 구독 데이터 (없으면 null)
resolved, // 메시지와 연결된 데이터 (없으면 null)
editedTimestamp, // 메시지가 마지막으로 수정된 시간 (null일 수 있음)

// 리액션 정보
reactions: {
message // 메시지 객체 (리액션이 연결된 메시지)
},

// 멘션 정보
mentions: {
everyone, // @everyone 또는 @here 멘션 여부
users, // 멘션된 사용자들의 컬렉션
roles, // 멘션된 역할들의 컬렉션
\_members, // 멘션된 멤버 데이터 (없으면 null)
\_channels, // 멘션된 채널 데이터 (없으면 null)
\_parsedUsers, // 파싱된 사용자 데이터 (없으면 null)
crosspostedChannels, // 크로스포스트된 채널들의 컬렉션
repliedUser // 답장된 사용자 (없으면 null)
},

// 기타 메시지 정보
webhookId, // 메시지가 웹훅을 통해 생성된 경우의 웹훅 ID
groupActivityApplication, // 그룹 활동 관련 데이터 (없으면 null)
applicationId, // 메시지와 연결된 애플리케이션 ID (없으면 null)
activity, // 메시지와 연결된 활동 데이터 (없으면 null)
flags, // 메시지 상태를 나타내는 플래그 비트 필드
reference, // 메시지 참조 데이터 (답장 메시지 관련)
interactionMetadata, // 인터랙션 메타데이터 (없으면 null)
interaction, // 메시지와 연결된 인터랙션 (없으면 null)
poll, // 메시지와 연결된 투표 데이터 (없으면 null)
call // 메시지와 연결된 통화 데이터 (없으면 null)
}

길드객체
{
// 길드 정보 (Guild 객체)
guild: {
id, // 길드 ID
name, // 길드 이름
icon, // 길드 아이콘 (없으면 null)
features, // 길드의 활성화된 기능 배열
commands, // 길드 명령어 관리 객체 (GuildApplicationCommandManager)
members, // 길드 멤버 관리 객체 (GuildMemberManager)
channels, // 길드 채널 관리 객체 (GuildChannelManager)
bans, // 길드 밴 관리 객체 (GuildBanManager)
roles, // 길드 역할 관리 객체 (RoleManager)
presences, // 길드 멤버 상태 관리 객체 (PresenceManager)
voiceStates, // 음성 상태 관리 객체 (VoiceStateManager)
stageInstances, // 스테이지 인스턴스 관리 객체 (StageInstanceManager)
invites, // 초대 관리 객체 (GuildInviteManager)
scheduledEvents, // 일정 이벤트 관리 객체 (GuildScheduledEventManager)
autoModerationRules, // 자동 조정 규칙 관리 객체 (AutoModerationRuleManager)
available, // 길드가 사용 가능한지 여부
shardId, // 샤드 ID
splash, // 길드 스플래시 이미지
banner, // 길드 배너 이미지
description, // 길드 설명
verificationLevel, // 길드 인증 수준
vanityURLCode, // 사용자 정의 URL 코드
nsfwLevel, // NSFW 레벨
premiumSubscriptionCount, // 부스트 수
discoverySplash, // 길드 디스커버리 스플래시
memberCount, // 길드 멤버 수
large, // 대형 길드 여부
premiumProgressBarEnabled, // 부스트 프로그레스 바 활성화 여부
applicationId, // 애플리케이션 ID (봇 관련)
afkTimeout, // AFK 시간 초과 (초 단위)
afkChannelId, // AFK 채널 ID
systemChannelId, // 시스템 메시지를 보낼 채널 ID
premiumTier, // 부스트 레벨
widgetEnabled, // 위젯 활성화 여부
widgetChannelId, // 위젯 채널 ID
explicitContentFilter, // 콘텐츠 필터링 수준
mfaLevel, // MFA 수준
joinedTimestamp, // 길드에 가입한 시간 (밀리초 단위)
defaultMessageNotifications, // 기본 메시지 알림 설정
systemChannelFlags, // 시스템 채널 플래그 비트 필드
maximumMembers, // 최대 멤버 수
maximumPresences, // 최대 프레즌스 수
maxVideoChannelUsers, // 비디오 채널 최대 사용자 수
maxStageVideoChannelUsers, // 스테이지 비디오 채널 최대 사용자 수
approximateMemberCount, // 예상 멤버 수
approximatePresenceCount, // 예상 프레즌스 수
vanityURLUses, // 사용자 정의 URL 사용 횟수
rulesChannelId, // 규칙 채널 ID
publicUpdatesChannelId, // 공지 채널 ID
preferredLocale, // 기본 언어
safetyAlertsChannelId, // 안전 경고 채널 ID
ownerId, // 길드 소유자 ID
emojis, // 길드 이모지 관리 객체 (GuildEmojiManager)
stickers // 길드 스티커 관리 객체 (GuildStickerManager)
},

// 멤버 정보
joinedTimestamp, // 길드에 가입한 시간 (밀리초 단위)
premiumSinceTimestamp, // 부스트 시작 시간 (없으면 null)
nickname, // 멤버의 닉네임 (없으면 null)
pending, // 멤버가 보류 중인지 여부
communicationDisabledUntilTimestamp, // 대화 금지 시간 (없으면 null)

// 작성자 정보 (User 객체)
user: {
id, // 사용자 ID
bot, // 사용자가 봇인지 여부
system, // 사용자가 시스템 계정인지 여부
flags, // 사용자 플래그 비트 필드
username, // 사용자 이름
globalName, // 글로벌 이름
discriminator, // 태그 번호 (예: "1234")
avatar, // 아바타 해시
banner, // 배너 (없으면 undefined)
accentColor, // 강조 색상 (없으면 undefined)
avatarDecoration, // 아바타 장식 (없으면 null)
avatarDecorationData // 아바타 장식 데이터 (없으면 null)
},

// 기타 정보
avatar, // 멤버의 길드 아바타 (없으면 null)
flags // 길드 멤버 플래그 비트 필드
}
