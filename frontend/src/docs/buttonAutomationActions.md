# Button Automation Actions Documentation

## 새로 추가된 액션 타입

### 1. 채널 권한 관리 액션

#### `set_channel_permission`
- **설명**: 특정 채널에 대한 개별 권한을 설정합니다
- **파라미터**:
  - `channelId`: 대상 채널 ID
  - `permission`: 설정할 권한 (VIEW_CHANNEL, SEND_MESSAGES 등)
  - `state`: 권한 상태 (allow/deny/default)
- **필요 권한**: MANAGE_CHANNELS
- **사용 예시**: 특정 사용자가 특정 채널에 메시지를 보낼 수 없도록 설정

#### `remove_channel_permission`
- **설명**: 특정 채널에 대한 권한 오버라이드를 완전히 제거합니다
- **파라미터**:
  - `channelId`: 대상 채널 ID
- **필요 권한**: MANAGE_CHANNELS
- **사용 예시**: 사용자의 채널 권한을 기본값으로 되돌리기

#### `override_channel_permission`
- **설명**: 채널에 대한 여러 권한을 한번에 설정합니다
- **파라미터**:
  - `channelId`: 대상 채널 ID
  - `permissions`: 허용할 권한 목록 (다중 선택)
  - `deniedPermissions`: 거부할 권한 목록 (다중 선택)
- **필요 권한**: MANAGE_CHANNELS
- **사용 예시**: 특정 역할에 대해 채널 보기는 허용하되 메시지 전송은 금지

#### `reset_channel_permission`
- **설명**: 채널의 모든 권한 오버라이드를 제거하고 기본값으로 되돌립니다
- **파라미터**:
  - `channelId`: 대상 채널 ID
- **필요 권한**: MANAGE_CHANNELS
- **사용 예시**: 채널 권한 설정 초기화

### 2. 음성 제어 액션

#### `set_voice_mute`
- **설명**: 음성 채널에서 사용자의 마이크를 음소거하거나 해제합니다
- **파라미터**:
  - `mute`: 음소거 여부 (true/false)
  - `reason`: 음소거 사유 (선택사항)
- **필요 권한**: MUTE_MEMBERS
- **사용 예시**: 방해하는 사용자의 마이크 음소거

#### `set_voice_deafen`
- **설명**: 음성 채널에서 사용자의 스피커를 차단하거나 해제합니다
- **파라미터**:
  - `deafen`: 차단 여부 (true/false)
  - `reason`: 차단 사유 (선택사항)
- **필요 권한**: DEAFEN_MEMBERS
- **사용 예시**: 특정 사용자가 대화를 들을 수 없도록 차단

#### `toggle_voice_mute`
- **설명**: 사용자의 마이크 상태를 토글합니다 (음소거 ↔ 해제)
- **파라미터**:
  - `reason`: 토글 사유 (선택사항)
- **필요 권한**: MUTE_MEMBERS
- **사용 예시**: 빠른 음소거/해제 전환

#### `toggle_voice_deafen`
- **설명**: 사용자의 스피커 상태를 토글합니다 (차단 ↔ 해제)
- **파라미터**:
  - `reason`: 토글 사유 (선택사항)
- **필요 권한**: DEAFEN_MEMBERS
- **사용 예시**: 빠른 스피커 차단/해제 전환

#### `set_priority_speaker`
- **설명**: 음성 채널에서 우선 발언자 권한을 설정합니다
- **파라미터**:
  - `enabled`: 활성화 여부 (true/false)
  - `channelId`: 특정 채널 ID (선택사항, 없으면 현재 채널)
- **필요 권한**: PRIORITY_SPEAKER
- **사용 예시**: 발표자에게 우선 발언 권한 부여

### 3. 기타 추가 액션

#### `toggle_role`
- **설명**: 사용자의 역할을 토글합니다 (있으면 제거, 없으면 추가)
- **파라미터**:
  - `roleId`: 토글할 역할 ID
- **필요 권한**: MANAGE_ROLES
- **사용 예시**: 구독자 역할 토글 버튼

#### `reset_nickname`
- **설명**: 사용자의 닉네임을 원래대로 되돌립니다
- **파라미터**: 없음
- **필요 권한**: MANAGE_NICKNAMES
- **사용 예시**: 부적절한 닉네임 초기화

#### `send_dm`
- **설명**: 사용자에게 개인 메시지를 전송합니다
- **파라미터**:
  - `messageContent`: 전송할 메시지 내용
- **필요 권한**: 없음
- **사용 예시**: 개인적인 안내 메시지 전송

#### `move_voice_channel`
- **설명**: 사용자를 다른 음성 채널로 이동시킵니다
- **파라미터**:
  - `channelId`: 이동할 채널 ID
- **필요 권한**: MOVE_MEMBERS
- **사용 예시**: 대기실에서 회의실로 이동

#### `disconnect_voice`
- **설명**: 사용자의 음성 채널 연결을 해제합니다
- **파라미터**: 없음
- **필요 권한**: MOVE_MEMBERS
- **사용 예시**: AFK 사용자 연결 해제

#### `remove_timeout`
- **설명**: 사용자의 타임아웃을 해제합니다
- **파라미터**:
  - `reason`: 해제 사유 (선택사항)
- **필요 권한**: MODERATE_MEMBERS
- **사용 예시**: 타임아웃 조기 해제

## 권한 오버라이드 시스템 설명

Discord의 권한 오버라이드는 다음과 같은 우선순위로 적용됩니다:

1. **기본 역할 권한**: 모든 역할의 권한을 합산
2. **@everyone 거부**: @everyone 역할의 거부 권한 적용
3. **@everyone 허용**: @everyone 역할의 허용 권한 적용
4. **역할별 거부**: 다른 역할들의 거부 권한 적용
5. **역할별 허용**: 다른 역할들의 허용 권한 적용
6. **개인 거부**: 특정 사용자의 거부 권한 적용
7. **개인 허용**: 특정 사용자의 허용 권한 적용

## 사용 시나리오

### 시나리오 1: VIP 전용 채널 설정
```javascript
{
  type: 'override_channel_permission',
  target: 'specific',
  targetValue: '@everyone',
  parameters: {
    channelId: 'vip-channel-id',
    permissions: [],
    deniedPermissions: ['VIEW_CHANNEL']
  }
}
// 이후 VIP 역할에 대해서만 VIEW_CHANNEL 허용
```

### 시나리오 2: 음성 채널 관리
```javascript
// 말썽꾸러기 음소거
{
  type: 'set_voice_mute',
  target: 'specific',
  targetValue: 'user-id',
  parameters: {
    mute: true,
    reason: '경고 3회 누적'
  }
}
```

### 시나리오 3: 채널 잠금
```javascript
// 긴급 상황 시 채널 잠금
{
  type: 'set_channel_permission',
  target: 'all',
  parameters: {
    channelId: 'general-channel',
    permission: 'SEND_MESSAGES',
    state: 'deny'
  }
}
```

## 주의사항

1. **권한 충돌**: 허용 권한은 항상 거부 권한보다 우선합니다
2. **관리자 권한**: ADMINISTRATOR 권한을 가진 사용자는 모든 권한 오버라이드를 무시합니다
3. **봇 권한**: 봇은 자신이 가진 권한만 부여할 수 있습니다
4. **역할 계층**: 봇은 자신보다 높은 역할을 가진 사용자를 제어할 수 없습니다