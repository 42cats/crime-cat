# Discord 자동화 버튼 시스템 설계 문서

## 1. 시스템 개요

### 1.1 목적
Discord 서버에서 버튼 클릭을 통해 다양한 자동화 액션을 실행할 수 있는 시스템

### 1.2 핵심 요구사항
- 액션 타입별 모듈화된 처리기
- 순차적 액션 실행 보장
- 확장 가능한 액션 관리 시스템
- 에러 복구 및 롤백 메커니즘
- 캐시 동기화 시스템

## 2. 액션 타입 정의 및 JSON 구조

### 2.1 역할 관리 액션
```javascript
// 역할 추가
{
  "type": "add_role",
  "target": "executor", // executor, all, role, specific, admin
  "parameters": {
    "roleId": "123456789012345678"
  },
  "delay": 0,
  "result": {
    "message": "역할이 추가되었습니다!",
    "visibility": "none" // none, private, current_channel, specific_channel, ephemeral
  }
}

// 역할 제거
{
  "type": "remove_role",
  "target": "executor",
  "parameters": {
    "roleId": "123456789012345678"
  },
  "delay": 0,
  "result": {
    "message": "역할이 제거되었습니다!",
    "visibility": "none"
  }
}

// 역할 토글 (다중 역할 지원)
{
  "type": "toggle_role",
  "target": "executor",
  "parameters": {
    "roleIds": ["123456789012345678", "987654321098765432"]
  },
  "delay": 0,
  "result": {
    "message": "역할이 토글되었습니다!",
    "visibility": "none"
  }
}
```

### 2.2 닉네임 관리 액션
```javascript
// 닉네임 변경
{
  "type": "change_nickname",
  "target": "executor",
  "parameters": {
    "nickname": "🎮 {username}"
  },
  "delay": 0,
  "result": {
    "message": "닉네임이 변경되었습니다!",
    "visibility": "none"
  }
}

// 닉네임 초기화
{
  "type": "reset_nickname",
  "target": "executor",
  "parameters": {},
  "delay": 0,
  "result": {
    "message": "닉네임이 초기화되었습니다!",
    "visibility": "none"
  }
}
```

### 2.3 메시지 전송 액션
```javascript
// 채널 메시지 전송
{
  "type": "send_message",
  "target": "executor",
  "parameters": {
    "channelId": "123456789012345678",
    "message": "안녕하세요, {user}님!"
  },
  "delay": 0,
  "result": {
    "message": "메시지가 전송되었습니다!",
    "visibility": "none"
  }
}

// DM 전송
{
  "type": "send_dm",
  "target": "executor",
  "parameters": {
    "message": "개인 메시지입니다, {username}님!"
  },
  "delay": 0,
  "result": {
    "message": "개인 메시지가 전송되었습니다!",
    "visibility": "none"
  }
}
```

### 2.4 음성 채널 관리 액션
```javascript
// 음성 채널 이동
{
  "type": "move_voice_channel",
  "target": "executor",
  "parameters": {
    "channelId": "123456789012345678"
  },
  "delay": 0,
  "result": {
    "message": "음성 채널로 이동되었습니다!",
    "visibility": "none"
  }
}

// 음성 연결 해제
{
  "type": "disconnect_voice",
  "target": "executor",
  "parameters": {},
  "delay": 0,
  "result": {
    "message": "음성 채널에서 연결 해제되었습니다!",
    "visibility": "none"
  }
}
```

### 2.5 음성 제어 액션
```javascript
// 마이크 음소거
{
  "type": "set_voice_mute",
  "target": "executor",
  "parameters": {
    "enable": true
  },
  "delay": 0,
  "result": {
    "message": "마이크가 음소거되었습니다!",
    "visibility": "none"
  }
}

// 스피커 차단
{
  "type": "set_voice_deafen",
  "target": "executor",
  "parameters": {
    "enable": true
  },
  "delay": 0,
  "result": {
    "message": "스피커가 차단되었습니다!",
    "visibility": "none"
  }
}

// 마이크 토글
{
  "type": "toggle_voice_mute",
  "target": "executor",
  "parameters": {},
  "delay": 0,
  "result": {
    "message": "마이크 상태가 변경되었습니다!",
    "visibility": "none"
  }
}

// 스피커 토글
{
  "type": "toggle_voice_deafen",
  "target": "executor",
  "parameters": {},
  "delay": 0,
  "result": {
    "message": "스피커 상태가 변경되었습니다!",
    "visibility": "none"
  }
}

// 우선 발언자 설정
{
  "type": "set_priority_speaker",
  "target": "executor",
  "parameters": {
    "enable": true
  },
  "delay": 0,
  "result": {
    "message": "우선 발언자로 설정되었습니다!",
    "visibility": "none"
  }
}
```

### 2.6 채널 권한 관리 액션
```javascript
// 채널 권한 설정
{
  "type": "set_channel_permission",
  "target": "role",
  "parameters": {
    "channelIds": ["123456789012345678", "987654321098765432"],
    "permissions": ["ViewChannel", "SendMessages"],
    "targetRoleIds": ["111222333444555666"]
  },
  "delay": 0,
  "result": {
    "message": "채널 권한이 설정되었습니다!",
    "visibility": "none"
  }
}

// 채널 권한 제거
{
  "type": "remove_channel_permission",
  "target": "role",
  "parameters": {
    "channelIds": ["123456789012345678"],
    "permissions": ["ViewChannel"],
    "targetRoleIds": ["111222333444555666"]
  },
  "delay": 0,
  "result": {
    "message": "채널 권한이 제거되었습니다!",
    "visibility": "none"
  }
}

// 채널 권한 오버라이드
{
  "type": "override_channel_permission",
  "target": "specific",
  "parameters": {
    "channelIds": ["123456789012345678"],
    "permissions": ["ViewChannel", "SendMessages"],
    "targetUserId": "999888777666555444"
  },
  "delay": 0,
  "result": {
    "message": "채널 권한이 오버라이드되었습니다!",
    "visibility": "none"
  }
}

// 채널 권한 초기화
{
  "type": "reset_channel_permission",
  "target": "role",
  "parameters": {
    "channelIds": ["123456789012345678"],
    "targetRoleIds": ["111222333444555666"]
  },
  "delay": 0,
  "result": {
    "message": "채널 권한이 초기화되었습니다!",
    "visibility": "none"
  }
}
```

### 2.7 모더레이션 액션
```javascript
// 타임아웃 해제
{
  "type": "remove_timeout",
  "target": "specific",
  "parameters": {
    "targetUserId": "123456789012345678"
  },
  "delay": 0,
  "result": {
    "message": "타임아웃이 해제되었습니다!",
    "visibility": "none"
  }
}
```

### 2.8 음악 관리 액션
```javascript
// 음악 재생 (single-track 모드)
{
  "type": "play_music",
  "target": "executor",
  "parameters": {
    "trackTitle": "Relaxing Music"
  },
  "delay": 0,
  "result": {
    "message": "음악이 재생되었습니다!",
    "visibility": "none"
  }
}

// 음악 정지
{
  "type": "stop_music",
  "target": "executor",
  "parameters": {},
  "delay": 0,
  "result": {
    "message": "음악이 정지되었습니다!",
    "visibility": "none"
  }
}

// 음악 일시정지/재개
{
  "type": "pause_music",
  "target": "executor",
  "parameters": {},
  "delay": 0,
  "result": {
    "message": "음악이 일시정지/재개되었습니다!",
    "visibility": "none"
  }
}
```

### 2.9 버튼 설정 액션
```javascript
// 버튼 설정 변경
{
  "type": "button_setting",
  "target": "executor",
  "parameters": {
    "enable": true
  },
  "delay": 0,
  "result": {
    "message": "버튼 설정이 변경되었습니다!",
    "visibility": "none"
  }
}
```

### 2.10 다중 대상 지원
```javascript
// 관리자 대상 액션
{
  "type": "add_role",
  "target": "admin",
  "parameters": {
    "roleId": "123456789012345678"
  },
  "delay": 0,
  "result": {
    "message": "관리자들에게 역할이 추가되었습니다!",
    "visibility": "none"
  }
}

// 다중 역할 대상 액션
{
  "type": "add_role",
  "target": "role",
  "parameters": {
    "roleId": "123456789012345678",
    "targetRoleIds": ["987654321098765432", "111222333444555666"]
  },
  "delay": 0,
  "result": {
    "message": "역할이 추가되었습니다!",
    "visibility": "none"
  }
}

// 특정 사용자에게 적용
{
  "type": "add_role",
  "target": "specific",
  "parameters": {
    "roleId": "123456789012345678",
    "targetUserId": "111222333444555666"
  },
  "delay": 0,
  "result": {
    "message": "역할이 추가되었습니다!",
    "visibility": "none"
  }
}
```

### 2.11 결과 메시지 옵션
```javascript
// 결과 메시지 없음 (기본값)
{
  "result": {
    "visibility": "none"
  }
}

// 개인 메시지 (DM)
{
  "result": {
    "message": "작업이 완료되었습니다!",
    "visibility": "private"
  }
}

// 임시 메시지 (개인에게만 보임)
{
  "result": {
    "message": "작업이 완료되었습니다!",
    "visibility": "ephemeral"
  }
}

// 현재 채널에 메시지
{
  "result": {
    "message": "작업이 완료되었습니다!",
    "visibility": "current_channel"
  }
}

// 특정 채널에 메시지
{
  "result": {
    "message": "작업이 완료되었습니다!",
    "visibility": "specific_channel",
    "channelId": "123456789012345678"
  }
}
```

### 2.12 변수 치환 시스템
```javascript
// 사용 가능한 변수들
{
  "result": {
    "message": "안녕하세요 {user}님! 현재 서버는 {guild}이고, 채널은 {channel}입니다. 사용자명: {username}, 버튼: {button}"
  }
}

// {user} - 사용자 멘션 (<@userid>)
// {username} - 사용자 이름
// {guild} - 서버 이름
// {channel} - 현재 채널 이름
// {button} - 버튼 라벨
```

## 3. 완전한 버튼 설정 예시

### 3.1 기본 역할 부여 버튼
```json
{
  "trigger": {
    "type": "everyone",
    "roles": [],
    "users": []
  },
  "conditions": {
    "requiredRoles": [],
    "deniedRoles": [],
    "requiredChannels": [],
    "cooldownSeconds": 0,
    "oncePerUser": false
  },
  "actions": [
    {
      "type": "add_role",
      "target": "executor",
      "parameters": {
        "roleId": "123456789012345678"
      },
      "delay": 0,
      "result": {
        "message": "역할이 부여되었습니다!",
        "visibility": "none"
      }
    }
  ],
  "buttonSettings": {
    "style": "primary",
    "disableAfterUse": false
  },
  "options": {
    "oncePerUser": false,
    "logEnabled": true
  }
}
```

### 3.2 복합 액션 버튼 (역할 + 닉네임 + 메시지)
```json
{
  "trigger": {
    "type": "role",
    "roles": ["987654321098765432"],
    "users": []
  },
  "conditions": {
    "requiredRoles": ["111222333444555666"],
    "deniedRoles": [],
    "requiredChannels": ["777888999000111222"],
    "cooldownSeconds": 60,
    "oncePerUser": false
  },
  "actions": [
    {
      "type": "add_role",
      "target": "executor",
      "parameters": {
        "roleId": "123456789012345678"
      },
      "delay": 0,
      "result": {
        "message": "VIP 역할이 부여되었습니다!",
        "visibility": "ephemeral"
      }
    },
    {
      "type": "change_nickname",
      "target": "executor",
      "parameters": {
        "nickname": "⭐ {username}"
      },
      "delay": 1,
      "result": {
        "message": "닉네임이 변경되었습니다!",
        "visibility": "ephemeral"
      }
    },
    {
      "type": "send_message",
      "target": "executor",
      "parameters": {
        "channelId": "333444555666777888",
        "message": "🎉 {user}님이 VIP가 되었습니다!"
      },
      "delay": 2,
      "result": {
        "message": "환영 메시지가 전송되었습니다!",
        "visibility": "ephemeral"
      }
    }
  ],
  "buttonSettings": {
    "style": "success",
    "disableAfterUse": true
  },
  "options": {
    "oncePerUser": true,
    "logEnabled": true
  }
}
```

## 4. Discord 봇 액션 처리기 아키텍처

### 4.1 핵심 구성요소

#### 4.1.1 ButtonAutomationEngine (ButtonAutomationEngine.js)
- 23개 액션 실행기 관리 및 초기화
- 순차적 액션 실행 보장 (지연 시간 준수)
- 실행 기록 관리 및 상태 추적
- 메시지 변수 치환 시스템

#### 4.1.2 ButtonAutomationHandler (ButtonAutomationHandler.js)
- Discord 버튼 상호작용 처리
- 조건 검증 (역할, 채널, 쿨다운)
- 즉시 응답 및 결과 메시지 전송
- 쿨다운 관리 시스템

#### 4.1.3 BaseActionExecutor (BaseActionExecutor.js)
- 모든 액션 실행기의 기본 클래스
- 대상 해석 시스템 (executor, admin, role, all, specific)
- 빈 대상 처리 개선 (에러 대신 빈 배열 반환)
- Discord API 안전 호출 래퍼

### 4.2 액션 실행기 구현 현황

#### 4.2.1 역할 관리 (RoleActionExecutor.js)
- `add_role`, `remove_role`, `toggle_role`
- 다중 역할 배열 처리 지원
- manageable 속성 실행 시점 확인
- 개별 역할별 성공/실패 결과 반환

#### 4.2.2 닉네임 관리 (NicknameActionExecutor.js)
- `change_nickname`, `reset_nickname`
- manageable 속성 실행 시점 확인
- 변수 치환 지원 ({username} 등)

#### 4.2.3 메시지 전송 (MessageActionExecutor.js)
- `send_message`, `send_dm`
- 채널 접근 권한 확인
- 메시지 길이 제한 검증

#### 4.2.4 음성 채널 관리 (VoiceActionExecutor.js)
- `move_voice_channel`, `disconnect_voice`
- `set_voice_mute`, `set_voice_deafen`
- `toggle_voice_mute`, `toggle_voice_deafen`
- `set_priority_speaker`
- 음성 채널 접속 상태 확인

#### 4.2.5 채널 권한 관리 (ChannelPermissionExecutor.js)
- `set_channel_permission`, `remove_channel_permission`
- `override_channel_permission`, `reset_channel_permission`
- Discord.js v14 호환성 (ViewChannel, SendMessages 등)
- 카테고리 채널 자동 상속 시스템
- 다중 채널 및 역할 처리

#### 4.2.6 모더레이션 (ModerationExecutor.js)
- `remove_timeout`
- 모더레이션 권한 확인

#### 4.2.7 음악 관리 (MusicActionExecutor.js)
- `play_music`, `stop_music`, `pause_music`
- MusicPlayerV4 시스템 통합
- single-track 모드 기본 설정
- 사용자 음성 채널 확인

#### 4.2.8 버튼 설정 (ButtonSettingExecutor.js)
- `button_setting`
- 버튼 상태 토글 기능

## 5. 이벤트 핸들러 및 캐시 무효화 시스템

### 5.1 Discord 이벤트 리스너
- **channelCreate/Update/Delete**: 채널 변경 감지
- **roleCreate/Update/Delete**: 역할 변경 감지
- 백엔드 캐시 API 자동 무효화 호출

### 5.2 이벤트 등록 시스템 (loadEvent.js)
- 자동 이벤트 핸들러 등록
- once/on 이벤트 타입 지원
- 표준 Discord.js 이벤트 구조

### 5.3 주요 수정 사항
- 이벤트 이름 오타 수정: 'interactionHandeleder' → 'interactionCreate'
- 매개변수 구조 표준화
- 중복 이벤트 등록 제거

## 6. 프론트엔드 통합 및 개선사항

### 6.1 ActionEditor 개선
- "관리자" 대상 옵션 추가 (모든사용자 대신)
- 다중 역할 선택 지원 구현
- 임시(ephemeral) 메시지 옵션 추가
- 결과 표시 기본값: "표시안함"으로 변경

### 6.2 TestRunner 완전 구현
- 23개 모든 액션 타입 지원
- 역할/채널/사용자 이름 해석
- Ant Design v5 호환성 (visible → open)
- Timeline.Item → items 배열 구조

### 6.3 AdvancedButtonForm 수정
- 미리보기 탭 역할 이름 표시
- 결과 메시지 가시성 정확한 표시
- getTargetDisplayName 함수 개선

### 6.4 버튼 라벨 제한
- Discord 버튼 라벨 80자 제한 적용

## 7. 지연시간 및 쿨다운 시스템

### 7.1 지연 처리 (Delay)
- **처리 위치**: ButtonAutomationEngine에서만 처리
- **실행 방식**: 순차적 처리 (이전 액션 완료 + 지연시간 후 다음 액션 시작)
- **단위**: 초 단위 통일
- **중복 제거**: ButtonAutomationHandler의 중복 로직 제거

### 7.2 쿨다운 (Cooldown)
- **설정 시점**: executeActionsWithEngine 완료 후 반드시 설정
- **조건**: 사용 제한 및 액션 실행 전 확인
- **관리**: ButtonAutomationHandler에서 Map 구조로 관리

## 8. 현재 진행 상황

### 8.1 완료된 기능들 ✅
- **액션 실행기 23개 모든 구현 완료** (button_setting 추가)
- **액션 엔진 및 핸들러 구현 완료**  
- **다중 역할 선택 지원 구현**
- **백엔드 API 연동 완료**
- **권한 검증 시스템 구현**
- **에러 핸들링 시스템 구현** (ephemeral 메시지 지원)
- **다양한 결과 표시 옵션 구현** (ephemeral 메시지 포함)
- **사용자 변수 치환 시스템 구현**
- **카테고리 채널 권한 상속 시스템 구현**
- **Discord.js v14 호환성 완료** (permission 네이밍 수정)
- **버튼 라벨 길이 제한 적용** (80자)
- **음악 재생 시스템 완전 수정** (V4 아키텍처 기반)
- **단일 트랙 재생 모드 구현 및 기본값 설정**
- **임시(ephemeral) 메시지 옵션 추가**
- **빈 대상 처리 개선** (에러 대신 빈 배열 반환)
- **Discord 이벤트 리스너 캐시 무효화 시스템**
- **TestRunner 모든 액션 타입 지원 추가**
- **Ant Design v5 호환성 수정**
- **이벤트 핸들러 등록 문제 수정**
- **지연시간 및 쿨다운 로직 정리**

### 8.2 핵심 수정 사항 요약

#### 8.2.1 대상 시스템 개선
- "모든사용자" → "관리자" 옵션 변경
- 다중 역할 선택 지원 (roleIds 배열)
- 빈 대상 우아한 처리 (role, admin, all 타겟)

#### 8.2.2 권한 시스템 강화
- manageable 속성 실행 시점 확인
- Discord.js v14 permission 네이밍 적용
- 카테고리 채널 권한 자동 상속

#### 8.2.3 음악 시스템 완전 수정
- MusicPlayerV4 아키텍처 기반 통합
- single-track 재생 모드 기본값 설정
- 사용자 음성 채널 상태 확인 강화

#### 8.2.4 메시지 시스템 개선
- ephemeral 메시지 옵션 추가
- 기본 가시성 "표시안함"으로 변경
- 사용자 친화적 에러 메시지

#### 8.2.5 캐시 무효화 시스템
- Discord 이벤트 기반 실시간 캐시 무효화
- channelCreate/Update/Delete 감지
- roleCreate/Update/Delete 감지

#### 8.2.6 개발자 경험 개선
- TestRunner 전체 액션 타입 지원
- 역할/채널 이름 실제 해석 표시
- Ant Design v5 호환성 수정
- 이벤트 핸들러 등록 안정화

#### 8.2.7 시스템 안정성 향상
- 중복 지연 처리 로직 제거
- 쿨다운 설정 보장
- 순차적 액션 실행 확정
- 에러 전파 방지

### 8.3 현재 상태
**완전히 작동하는 Discord 자동화 버튼 시스템** ✅

- ✅ 23개 액션 타입 모든 구현 완료
- ✅ 프론트엔드-백엔드-봇 완전 통합
- ✅ 실시간 캐시 동기화
- ✅ 다중 역할/채널 지원
- ✅ 권한 및 조건 검증
- ✅ 에러 처리 및 사용자 피드백
- ✅ 변수 치환 및 메시지 시스템
- ✅ 지연시간 및 쿨다운 관리
- ✅ Discord.js v14 완전 호환
- ✅ 성능 최적화 및 안정성 보장

---

## 🎯 시스템 특징 요약

### 핵심 기능
1. **23개 액션 타입**: 역할, 닉네임, 메시지, 음성, 권한, 모더레이션, 음악 관리
2. **다중 대상 지원**: executor, admin, role(다중), all, specific
3. **실시간 동기화**: Discord 이벤트 기반 캐시 무효화
4. **순차적 실행**: 지연시간 준수하는 액션 체인
5. **강화된 권한**: Discord.js v14 기반 권한 검증
6. **사용자 경험**: ephemeral 메시지, 변수 치환, 에러 피드백

### 기술적 우수성
1. **모듈화 설계**: 23개 독립적 액션 실행기
2. **확장성**: 새로운 액션 타입 쉬운 추가
3. **안정성**: 빈 대상 처리, 에러 격리, 권한 검증
4. **성능**: 중복 로직 제거, 효율적 캐시 관리
5. **호환성**: Discord.js v14, Ant Design v5 지원

이 시스템은 **완전히 작동하는 프로덕션 레벨의 Discord 자동화 플랫폼**으로 현재 모든 핵심 기능이 구현되어 있으며, 확장 가능하고 유지보수 가능한 아키텍처를 갖추고 있습니다.