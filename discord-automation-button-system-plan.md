# Discord 자동화 버튼 시스템 구현 계획서

## 📌 프로젝트 개요

Discord 서버 내에서 버튼 클릭을 통해 자동으로 특정 작업(역할 추가, 채널 접근 제한, 닉네임 변경 등)을 수행하는 기능을 웹 GUI로 설정하고, Discord.js 봇이 이를 실행하도록 연동하는 시스템입니다.

### 🎯 핵심 목표
- 기존 MessageButtonEditor의 단순 메시지 전송 기능을 확장
- 다양한 자동화 액션 지원 (역할, 권한, 닉네임 등)
- 사용자 친화적인 GUI 설정 인터페이스 제공
- 조건부 실행 및 다중 액션 지원

---

## 🏗️ 아키텍처 설계

### 📦 시스템 구성 요소

| 구성 요소 | 설명 |
|----------|------|
| **Trigger** | 버튼 클릭 이벤트 (누가 실행할 수 있는지) |
| **Condition** | 실행 조건 (역할 보유, 채널 제한 등) |
| **Action** | 실행할 기능 (무엇을 할 것인지) |
| **Method** | 실행 방식 (어떻게 실행할 것인지) |
| **Result** | 실행 결과 (메시지 출력, 버튼 상태 변경 등) |

### 🌳 페이지 구조

```
ButtonAutomationEditor.tsx (신규 메인 페이지)
├── AutomationGroup.tsx (자동화 그룹 컨테이너)
│   ├── GroupMessageConfig.tsx (그룹 메시지 설정)
│   └── AutomationButton.tsx (자동화 버튼)
│       ├── ButtonTriggerConfig.tsx (트리거 설정)
│       ├── ButtonConditionConfig.tsx (조건 설정)
│       ├── ActionList.tsx (액션 리스트)
│       │   └── ActionItem.tsx (개별 액션 아이템)
│       │       ├── ActionTypeSelector.tsx (액션 타입 선택)
│       │       ├── ActionParameterInputs.tsx (동적 파라미터 입력)
│       │       └── ActionResultConfig.tsx (액션별 결과 설정)
│       └── ButtonResultConfig.tsx (버튼 전체 결과 설정)
└── AutomationContext.tsx (자동화 데이터 컨텍스트)
```

---

## 💾 데이터베이스 설계

### 📊 테이블 구조

#### 1. 자동화 그룹 테이블 (`button_automation_groups`)
```sql
CREATE TABLE button_automation_groups (
  id VARCHAR(100) PRIMARY KEY,
  guild_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  -- 그룹 메시지 설정
  message_content TEXT COMMENT '버튼과 함께 출력될 메시지',
  message_emojis TEXT COMMENT '메시지에 포함될 이모지 목록 (JSON)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_guild_order (guild_id, display_order)
);
```

#### 2. 자동화 버튼 테이블 (`button_automations`)
```sql
CREATE TABLE button_automations (
  id VARCHAR(100) PRIMARY KEY,
  guild_id VARCHAR(50) NOT NULL,
  group_id VARCHAR(100),
  button_label VARCHAR(100) NOT NULL,
  -- 트리거 설정
  trigger_type ENUM('user', 'role', 'admin', 'everyone') DEFAULT 'everyone',
  trigger_value VARCHAR(50) COMMENT '특정 user_id 또는 role_id',
  -- 버튼 상태 변경 설정
  button_disable BOOLEAN DEFAULT FALSE,
  button_rename VARCHAR(100),
  button_style ENUM('primary', 'secondary', 'success', 'danger') DEFAULT 'primary',
  -- 메타 설정
  once_per_user BOOLEAN DEFAULT FALSE,
  cooldown_seconds INT DEFAULT 0,
  log_enabled BOOLEAN DEFAULT TRUE,
  -- 프롬프트 설정
  prompt_enabled BOOLEAN DEFAULT FALSE,
  prompt_type ENUM('select', 'modal') DEFAULT 'select',
  prompt_title VARCHAR(200),
  prompt_options TEXT COMMENT 'JSON 형식의 선택 옵션',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES button_automation_groups(id) ON DELETE CASCADE,
  INDEX idx_guild_group (guild_id, group_id)
);
```

#### 3. 자동화 액션 테이블 (`button_actions`)
```sql
CREATE TABLE button_actions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  automation_id VARCHAR(100) NOT NULL,
  action_order INT NOT NULL,
  -- 액션 타입
  action_type ENUM(
    'add_role', 'remove_role', 'toggle_role',
    'change_nickname', 'reset_nickname',
    'set_channel_permission', 'remove_channel_permission',
    'send_message', 'send_dm',
    'move_voice_channel', 'disconnect_voice',
    'set_slowmode', 'set_mute', 'set_deafen'
  ) NOT NULL,
  -- 액션 대상
  target_user ENUM('executor', 'specific', 'all') DEFAULT 'executor',
  target_value VARCHAR(50) COMMENT '특정 user_id (target_user가 specific일 때)',
  -- 액션 파라미터 (JSON으로 저장)
  parameters JSON NOT NULL COMMENT '액션별 필요 파라미터',
  -- 조건 설정
  condition_requires_roles TEXT COMMENT 'JSON 배열 - 필수 역할 목록',
  condition_allowed_roles TEXT COMMENT 'JSON 배열 - 허용 역할 목록',
  condition_denied_roles TEXT COMMENT 'JSON 배열 - 차단 역할 목록',
  condition_required_channel_id VARCHAR(50),
  -- 실행 설정
  delay_seconds INT DEFAULT 0,
  -- 결과 메시지 설정
  result_message_type ENUM('none', 'default', 'custom') DEFAULT 'none',
  result_message_content TEXT,
  result_message_visibility ENUM('public', 'private', 'dm') DEFAULT 'public',
  result_message_delete_after INT,
  result_message_emojis TEXT COMMENT 'JSON 배열 - 메시지 이모지',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (automation_id) REFERENCES button_automations(id) ON DELETE CASCADE,
  INDEX idx_automation_order (automation_id, action_order)
);
```

#### 4. 실행 로그 테이블 (`button_automation_logs`)
```sql
CREATE TABLE button_automation_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  automation_id VARCHAR(100) NOT NULL,
  guild_id VARCHAR(50) NOT NULL,
  executor_id VARCHAR(50) NOT NULL,
  execution_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  actions_executed JSON COMMENT '실행된 액션 목록',
  INDEX idx_automation_time (automation_id, execution_time),
  INDEX idx_guild_user (guild_id, executor_id)
);
```

---

## 🌐 API 설계

### 📡 RESTful 엔드포인트

#### 자동화 그룹 관리
```typescript
GET    /api/v1/automations/{guildId}/groups
POST   /api/v1/automations/{guildId}/groups
PUT    /api/v1/automations/{guildId}/groups/{groupId}
DELETE /api/v1/automations/{guildId}/groups/{groupId}
PUT    /api/v1/automations/{guildId}/groups/reorder
```

#### 자동화 버튼 관리
```typescript
GET    /api/v1/automations/{guildId}/buttons
POST   /api/v1/automations/{guildId}/buttons
PUT    /api/v1/automations/{guildId}/buttons/{buttonId}
DELETE /api/v1/automations/{guildId}/buttons/{buttonId}
POST   /api/v1/automations/{guildId}/buttons/{buttonId}/test
```

#### 액션 관리
```typescript
GET    /api/v1/automations/action-templates
POST   /api/v1/automations/{buttonId}/actions
PUT    /api/v1/automations/{buttonId}/actions/{actionId}
DELETE /api/v1/automations/{buttonId}/actions/{actionId}
PUT    /api/v1/automations/{buttonId}/actions/reorder
```

#### 실행 로그
```typescript
GET    /api/v1/automations/{guildId}/logs
GET    /api/v1/automations/{buttonId}/logs
```

### 📋 데이터 타입 정의

```typescript
// 프론트엔드 설정용 타입
interface AutomationGroupData {
  id: string;
  name: string;
  displayOrder: number;
  message?: {
    content: string;
    emojis: string[];
  };
  buttons: AutomationButtonData[];
}

interface AutomationButtonData {
  id: string;
  groupId: string;
  label: string;
  trigger: TriggerConfig;
  conditions?: ConditionConfig;
  actions: ActionConfig[];
  result?: ButtonResultConfig;
  options?: ButtonOptionsConfig;
  prompt?: PromptConfig;
}

interface ActionConfig {
  id: string;
  type: ActionType;
  order: number;
  target: TargetConfig;
  parameters: Record<string, any>;
  condition?: ActionConditionConfig;
  schedule?: ScheduleConfig;
  result?: ActionResultConfig;
}

// 내부 실행용 타입
interface InternalAutomationData {
  id: string;
  buttonLabel: string;
  triggerUserId?: string;
  triggerRoleId?: string;
  actions: InternalActionData[];
  meta: MetaConfig;
}

interface InternalActionData {
  type: string;
  user: 'executor' | 'specific' | 'all';
  userId?: string;
  parameters: Record<string, any>;
  conditions?: InternalConditionData;
}
```

---

## 🎨 프론트엔드 구현 계획

### 🧩 핵심 컴포넌트 기능

#### 1. **ActionItem.tsx** - 동적 액션 설정
- 액션 타입 선택 시 동적 UI 변경
- 파라미터 입력 필드 자동 생성
- 실시간 유효성 검증

```typescript
const actionTypeConfigs = {
  'add_role': {
    label: '역할 추가',
    icon: 'UserPlus',
    parameters: ['roleId'],
    requiredPermissions: ['MANAGE_ROLES']
  },
  'send_message': {
    label: '메시지 전송',
    icon: 'MessageSquare',
    parameters: ['channelId', 'messageContent'],
    requiredPermissions: ['SEND_MESSAGES']
  },
  // ... 기타 액션 타입
};
```

#### 2. **동적 드롭다운 시스템**
- 액션 타입에 따른 선택 옵션 동적 로드
- 캐싱을 통한 성능 최적화
- 검색 및 필터링 기능

```typescript
// 역할 선택 시
if (actionType === 'add_role') {
  loadRoles(guildId).then(roles => setRoleOptions(roles));
}

// 채널 선택 시
if (actionType === 'send_message') {
  loadChannels(guildId).then(channels => setChannelOptions(channels));
}
```

#### 3. **조건부 렌더링 로직**
```typescript
const renderActionParameters = (actionType: ActionType) => {
  switch (actionType) {
    case 'add_role':
    case 'remove_role':
      return <RoleSelector />;
    
    case 'change_nickname':
      return <NicknameInput />;
    
    case 'send_message':
      return (
        <>
          <ChannelSelector />
          <MessageEditor />
        </>
      );
    
    // ... 기타 액션 타입
  }
};
```

### 🎯 UX 개선 사항

#### 1. **가이드 시스템**
- 첫 사용자를 위한 온보딩 투어
- 각 기능별 툴팁 제공
- 예제 템플릿 제공

#### 2. **시각적 피드백**
- 드래그 앤 드롭 시 애니메이션
- 저장 상태 실시간 표시
- 에러 발생 시 명확한 안내

#### 3. **액션 플로우 시각화**
```
[버튼 클릭] → [조건 확인] → [액션 1] → [액션 2] → [결과 표시]
     ↓             ↓            ↓          ↓           ↓
   (트리거)    (통과/실패)   (5초 대기)  (즉시 실행)  (메시지)
```

---

## 📅 구현 일정

### Phase 1: 기반 구축 (1주)
- [ ] 데이터베이스 마이그레이션 파일 작성
- [ ] API 엔드포인트 구현
- [ ] 타입 정의 및 인터페이스 설계
- [ ] 기본 페이지 레이아웃 구성

### Phase 2: 핵심 기능 (2주)
- [ ] 액션 타입별 UI 컴포넌트 구현
- [ ] 동적 드롭다운 메뉴 시스템
- [ ] 드래그 앤 드롭 액션 순서 변경
- [ ] 자동 저장 기능

### Phase 3: 고급 기능 (1주)
- [ ] 조건부 실행 설정 UI
- [ ] 선택형 모달 프롬프트
- [ ] 실행 결과 커스터마이징
- [ ] 테스트 실행 기능

### Phase 4: 완성 및 최적화 (1주)
- [ ] 성능 최적화
- [ ] 에러 핸들링 강화
- [ ] 사용자 가이드 작성
- [ ] 테스트 및 버그 수정

---

## 🔒 보안 고려사항

### 1. **권한 검증**
- 프론트엔드와 백엔드 이중 검증
- Discord API 권한 확인
- 액션별 필요 권한 매핑

### 2. **Rate Limiting**
- 버튼 실행 쿨다운
- API 호출 제한
- 동시 실행 방지

### 3. **로깅 및 모니터링**
- 모든 액션 실행 로그 기록
- 실패 원인 추적
- 악용 패턴 감지

---

## 🚀 확장 가능성

### 1. **새로운 액션 타입**
- 쉽게 추가 가능한 플러그인 구조
- 액션 타입 레지스트리 패턴

### 2. **외부 연동**
- 웹훅 지원
- 외부 API 호출
- 커스텀 스크립트 실행

### 3. **고급 기능**
- 조건문 (if-else) 지원
- 반복문 지원
- 변수 및 템플릿 시스템

---

## 📝 마이그레이션 파일 (V1.4.0)

### V1.4.0_001_create_button_automation_system.sql
```sql
-- =========================================
-- V1.4.0_001: Discord 자동화 버튼 시스템 테이블 생성
-- 작성일: 2025-01-21
-- 목적: 버튼 클릭을 통한 다양한 자동화 액션 실행 기능 추가
-- =========================================

USE ${DB_DISCORD};

-- 1. 자동화 그룹 테이블 생성
CREATE TABLE IF NOT EXISTS button_automation_groups (
  id VARCHAR(100) PRIMARY KEY,
  guild_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  message_content TEXT COMMENT '버튼과 함께 출력될 메시지',
  message_emojis TEXT COMMENT '메시지에 포함될 이모지 목록 (JSON)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_guild_order (guild_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 자동화 버튼 테이블 생성
CREATE TABLE IF NOT EXISTS button_automations (
  id VARCHAR(100) PRIMARY KEY,
  guild_id VARCHAR(50) NOT NULL,
  group_id VARCHAR(100),
  button_label VARCHAR(100) NOT NULL,
  trigger_type ENUM('user', 'role', 'admin', 'everyone') DEFAULT 'everyone',
  trigger_value VARCHAR(50) COMMENT '특정 user_id 또는 role_id',
  button_disable BOOLEAN DEFAULT FALSE,
  button_rename VARCHAR(100),
  button_style ENUM('primary', 'secondary', 'success', 'danger') DEFAULT 'primary',
  once_per_user BOOLEAN DEFAULT FALSE,
  cooldown_seconds INT DEFAULT 0,
  log_enabled BOOLEAN DEFAULT TRUE,
  prompt_enabled BOOLEAN DEFAULT FALSE,
  prompt_type ENUM('select', 'modal') DEFAULT 'select',
  prompt_title VARCHAR(200),
  prompt_options TEXT COMMENT 'JSON 형식의 선택 옵션',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES button_automation_groups(id) ON DELETE CASCADE,
  INDEX idx_guild_group (guild_id, group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 자동화 액션 테이블 생성
CREATE TABLE IF NOT EXISTS button_actions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  automation_id VARCHAR(100) NOT NULL,
  action_order INT NOT NULL,
  action_type ENUM(
    'add_role', 'remove_role', 'toggle_role',
    'change_nickname', 'reset_nickname',
    'set_channel_permission', 'remove_channel_permission',
    'send_message', 'send_dm',
    'move_voice_channel', 'disconnect_voice',
    'set_slowmode', 'set_mute', 'set_deafen'
  ) NOT NULL,
  target_user ENUM('executor', 'specific', 'all') DEFAULT 'executor',
  target_value VARCHAR(50) COMMENT '특정 user_id (target_user가 specific일 때)',
  parameters JSON NOT NULL COMMENT '액션별 필요 파라미터',
  condition_requires_roles TEXT COMMENT 'JSON 배열 - 필수 역할 목록',
  condition_allowed_roles TEXT COMMENT 'JSON 배열 - 허용 역할 목록',
  condition_denied_roles TEXT COMMENT 'JSON 배열 - 차단 역할 목록',
  condition_required_channel_id VARCHAR(50),
  delay_seconds INT DEFAULT 0,
  result_message_type ENUM('none', 'default', 'custom') DEFAULT 'none',
  result_message_content TEXT,
  result_message_visibility ENUM('public', 'private', 'dm') DEFAULT 'public',
  result_message_delete_after INT,
  result_message_emojis TEXT COMMENT 'JSON 배열 - 메시지 이모지',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (automation_id) REFERENCES button_automations(id) ON DELETE CASCADE,
  INDEX idx_automation_order (automation_id, action_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 실행 로그 테이블 생성
CREATE TABLE IF NOT EXISTS button_automation_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  automation_id VARCHAR(100) NOT NULL,
  guild_id VARCHAR(50) NOT NULL,
  executor_id VARCHAR(50) NOT NULL,
  execution_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  actions_executed JSON COMMENT '실행된 액션 목록',
  INDEX idx_automation_time (automation_id, execution_time),
  INDEX idx_guild_user (guild_id, executor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 실행 제한 테이블 (once_per_user 기능용)
CREATE TABLE IF NOT EXISTS button_automation_user_executions (
  automation_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (automation_id, user_id),
  FOREIGN KEY (automation_id) REFERENCES button_automations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 데이터 마이그레이션 상태 확인
SELECT 'Button automation system tables created successfully' as status;
```

---

## 🔄 프론트 ↔ 내부 JSON 변환 예시

### 프론트엔드 설정 JSON
```json
{
  "id": "auto_001",
  "name": "참가자 등록",
  "groupMessage": {
    "content": "아래 버튼을 클릭하여 참가자로 등록하세요!",
    "emojis": ["🎮", "🎯"]
  },
  "trigger": {
    "type": "role",
    "value": "123456789012345678"
  },
  "conditions": {
    "requiredRoles": ["ROLE_등록가능"],
    "deniedRoles": ["ROLE_차단"],
    "requiredChannel": "CHANNEL_등록채널"
  },
  "actions": [
    {
      "type": "add_role",
      "target": { "type": "executor" },
      "parameters": {
        "roleId": "ROLE_참가자"
      },
      "delay": 3,
      "result": {
        "message": {
          "type": "custom",
          "content": "{user}님이 참가자가 되었습니다! 🎉",
          "visibility": "public",
          "deleteAfter": 10
        }
      }
    },
    {
      "type": "change_nickname",
      "target": { "type": "executor" },
      "parameters": {
        "nickname": "🎮 {username}"
      },
      "result": {
        "message": {
          "type": "custom",
          "content": "닉네임이 변경되었습니다.",
          "visibility": "private",
          "deleteAfter": 5
        }
      }
    }
  ],
  "result": {
    "button": {
      "disable": true,
      "rename": "✅ 완료됨",
      "style": "success"
    }
  },
  "options": {
    "oncePerUser": true,
    "cooldown": 60,
    "logEnabled": true
  }
}
```

### 내부 실행 JSON
```json
{
  "id": "auto_001",
  "buttonLabel": "참가자 등록",
  "triggerRoleId": "123456789012345678",
  "conditions": {
    "requiredRoles": ["ROLE_등록가능"],
    "deniedRoles": ["ROLE_차단"],
    "requiredChannel": "CHANNEL_등록채널"
  },
  "actions": [
    {
      "type": "add_role",
      "user": "executor",
      "parameters": {
        "roleId": "ROLE_참가자"
      },
      "delay": 3
    },
    {
      "type": "change_nickname",
      "user": "executor",
      "parameters": {
        "nickname": "🎮 {username}"
      }
    }
  ],
  "meta": {
    "oncePerUser": true,
    "cooldown": 60,
    "logEnabled": true
  }
}
```

---

## ✅ 결론

이 계획서를 기반으로 Discord 자동화 버튼 시스템을 체계적으로 구현할 수 있습니다. 각 단계별로 명확한 목표와 구현 방법을 제시하여, 개발 과정에서 일관성 있는 방향성을 유지할 수 있도록 설계되었습니다.

주요 성공 요소:
1. **확장 가능한 구조**: 새로운 액션 타입 추가가 용이
2. **사용자 친화적 UI**: 직관적인 설정 인터페이스
3. **안정적인 실행**: 조건 검증 및 에러 핸들링
4. **성능 최적화**: 효율적인 데이터 구조와 캐싱

이후 구현 과정에서 이 계획서를 참고하여 일관성 있는 개발을 진행하시기 바랍니다.

프론트 api는 /Users/byeonsanghun/goinfre/crime-cat/frontend/src/lib/api.ts 을 기반으로 생성하고
api 구조는 
비로그인도 사용가능한 공개 경로 /api/v1/public/**
로그인된 사용자만 가능한 /api/v1/**
디스코드 봇이 사용하는 /api/bot/v1/**

이 있고 백엔드는 /Users/byeonsanghun/goinfre/crime-cat/backend/backend/src/main/java/com/crimecat/backend/utils/AuthenticationUtil.java 로 유저인증을 하고
유저구조는 통합유저인 /Users/byeonsanghun/goinfre/crime-cat/backend/backend/src/main/java/com/crimecat/backend/user/domain/User.java 와 해당 유저구조에 포함된 웹유저 /Users/byeonsanghun/goinfre/crime-cat/backend/backend/src/main/java/com/crimecat/backend/webUser/domain/WebUser.java 와 디스코드 유저
Users/byeonsanghun/goinfre/crime-cat/backend/backend/src/main/java/com/crimecat/backend/user/domain/DiscordUser.java 가 있어
백엔드 캐시구조및 시큐리티 설정은 /Users/byeonsanghun/goinfre/crime-cat/backend/backend/src/main/java/com/crimecat/backend/config 에서 확인가능

디스코드는 에이피아이는 /Users/byeonsanghun/goinfre/crime-cat/bot/Commands/api 에 있고
커맨드는 /Users/byeonsanghun/goinfre/crime-cat/bot/Commands 에 잇는 커맨드 형식을따르고 유틸은 /Users/byeonsanghun/goinfre/crime-cat/bot/Commands/utility 에 있는 유틸을 사용하거나 추가한다 /Users/byeonsanghun/goinfre/crime-cat/bot/Response 에서 각종 버튼이나 이벤트에 응답하는 구조를 작성하고 /Users/byeonsanghun/goinfre/crime-cat/bot/main.js 는 메인 인 파일로 최초 실행 파일 구조이다.

모든 작업은 단계적으로 원인및 어떻게 진행할지 파악해서 총합 정리및 검토를 거치고 불완전 하거나 오류가 있으면 다시 초기 단계로 돌아가 재검토 하여 완성도를 높이고 그다음 사용자에게 어떻게 진행할지 브리핑한다음에 사용자가 승인하면 작업을 시작한다. 
 