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
  "target": "executor", // executor, all, role, specific
  "parameters": {
    "roleId": "123456789012345678"
  },
  "delay": 0,
  "result": {
    "message": "역할이 추가되었습니다!",
    "visibility": "private" // private, current_channel, specific_channel, none
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
    "visibility": "private"
  }
}

// 역할 토글
{
  "type": "toggle_role",
  "target": "executor",
  "parameters": {
    "roleId": "123456789012345678"
  },
  "delay": 0,
  "result": {
    "message": "역할이 토글되었습니다!",
    "visibility": "private"
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
    "visibility": "private"
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
    "visibility": "private"
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
    "visibility": "private"
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
    "message": "DM이 전송되었습니다!",
    "visibility": "private"
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
    "visibility": "private"
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
    "visibility": "private"
  }
}

// 음성 음소거 설정
{
  "type": "set_voice_mute",
  "target": "executor",
  "parameters": {
    "enable": true,
    "duration": 300 // 초 (0 = 영구)
  },
  "delay": 0,
  "result": {
    "message": "음소거가 설정되었습니다!",
    "visibility": "private"
  }
}

// 음성 차단 설정
{
  "type": "set_voice_deafen",
  "target": "executor",
  "parameters": {
    "enable": true,
    "duration": 300
  },
  "delay": 0,
  "result": {
    "message": "음성 차단이 설정되었습니다!",
    "visibility": "private"
  }
}

// 음성 음소거 토글
{
  "type": "toggle_voice_mute",
  "target": "executor",
  "parameters": {
    "duration": 0
  },
  "delay": 0,
  "result": {
    "message": "음소거가 토글되었습니다!",
    "visibility": "private"
  }
}

// 음성 차단 토글
{
  "type": "toggle_voice_deafen",
  "target": "executor",
  "parameters": {
    "duration": 0
  },
  "delay": 0,
  "result": {
    "message": "음성 차단이 토글되었습니다!",
    "visibility": "private"
  }
}

// 우선 발언자 설정
{
  "type": "set_priority_speaker",
  "target": "executor",
  "parameters": {
    "enable": true,
    "channelId": "123456789012345678" // 선택사항
  },
  "delay": 0,
  "result": {
    "message": "우선 발언자가 설정되었습니다!",
    "visibility": "private"
  }
}
```

### 2.5 채널 권한 관리 액션
```javascript
// 채널 권한 설정
{
  "type": "set_channel_permission",
  "target": "executor",
  "parameters": {
    "channelId": ["123456789012345678", "987654321098765432"], // 다중 선택 가능
    "permissions": ["VIEW_CHANNEL", "SEND_MESSAGES", "CONNECT"]
  },
  "delay": 0,
  "result": {
    "message": "채널 권한이 설정되었습니다!",
    "visibility": "private"
  }
}

// 채널 권한 제거
{
  "type": "remove_channel_permission",
  "target": "executor",
  "parameters": {
    "channelId": ["123456789012345678"],
    "permissions": ["SEND_MESSAGES"]
  },
  "delay": 0,
  "result": {
    "message": "채널 권한이 제거되었습니다!",
    "visibility": "private"
  }
}

// 채널 권한 오버라이드
{
  "type": "override_channel_permission",
  "target": "executor",
  "parameters": {
    "channelId": ["123456789012345678"],
    "permissions": ["VIEW_CHANNEL", "SEND_MESSAGES"],
    "deniedPermissions": ["MANAGE_MESSAGES"]
  },
  "delay": 0,
  "result": {
    "message": "채널 권한이 오버라이드되었습니다!",
    "visibility": "private"
  }
}

// 채널 권한 초기화
{
  "type": "reset_channel_permission",
  "target": "executor",
  "parameters": {
    "channelId": ["123456789012345678"]
  },
  "delay": 0,
  "result": {
    "message": "채널 권한이 초기화되었습니다!",
    "visibility": "private"
  }
}
```

### 2.6 서버 권한 관리 액션
```javascript
// 서버 권한 부여
{
  "type": "grant_server_permission",
  "target": "executor",
  "parameters": {
    "permissions": ["MANAGE_MESSAGES", "KICK_MEMBERS"]
  },
  "delay": 0,
  "result": {
    "message": "서버 권한이 부여되었습니다!",
    "visibility": "private"
  }
}

// 서버 권한 제거
{
  "type": "revoke_server_permission",
  "target": "executor",
  "parameters": {
    "permissions": ["MANAGE_MESSAGES"]
  },
  "delay": 0,
  "result": {
    "message": "서버 권한이 제거되었습니다!",
    "visibility": "private"
  }
}
```

### 2.7 모더레이션 액션
```javascript
// 사용자 타임아웃
{
  "type": "timeout_user",
  "target": "executor",
  "parameters": {
    "seconds": 3600, // 1시간
    "reason": "규칙 위반"
  },
  "delay": 0,
  "result": {
    "message": "타임아웃이 적용되었습니다!",
    "visibility": "private"
  }
}

// 타임아웃 해제
{
  "type": "remove_timeout",
  "target": "executor",
  "parameters": {
    "reason": "타임아웃 해제"
  },
  "delay": 0,
  "result": {
    "message": "타임아웃이 해제되었습니다!",
    "visibility": "private"
  }
}
```

### 2.8 음악 액션
```javascript
// 음악 재생
{
  "type": "play_music",
  "target": "executor",
  "parameters": {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "volume": 50,
    "loop": false
  },
  "delay": 0,
  "result": {
    "message": "음악이 재생되었습니다!",
    "visibility": "current_channel"
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
    "visibility": "current_channel"
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
    "visibility": "current_channel"
  }
}
```

### 2.9 대상별 액션 적용
```javascript
// 특정 역할의 모든 사용자에게 적용
{
  "type": "add_role",
  "target": "role",
  "parameters": {
    "roleId": "123456789012345678",
    "targetRoleId": "987654321098765432" // 이 역할을 가진 모든 사용자
  },
  "delay": 0,
  "result": {
    "message": "역할이 추가되었습니다!",
    "visibility": "private"
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
    "visibility": "private"
  }
}
```

### 2.10 결과 메시지 옵션
```javascript
// 결과 메시지 없음
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
        "visibility": "private"
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
        "visibility": "private"
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
        "visibility": "private"
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
        "visibility": "private"
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

### 3.3 모더레이션 버튼 (관리자 전용)
```json
{
  "trigger": {
    "type": "admin",
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
      "type": "timeout_user",
      "target": "specific",
      "parameters": {
        "targetUserId": "999888777666555444",
        "seconds": 3600,
        "reason": "규칙 위반"
      },
      "delay": 0,
      "result": {
        "message": "사용자가 타임아웃되었습니다.",
        "visibility": "current_channel"
      }
    }
  ],
  "buttonSettings": {
    "style": "danger",
    "disableAfterUse": false
  },
  "options": {
    "oncePerUser": false,
    "logEnabled": true
  }
}
```

### 3.4 음성 채널 관리 버튼
```json
{
  "trigger": {
    "type": "everyone",
    "roles": [],
    "users": []
  },
  "conditions": {
    "requiredChannels": ["voice_channel_id"],
    "cooldownSeconds": 30,
    "oncePerUser": false
  },
  "actions": [
    {
      "type": "set_voice_mute",
      "target": "executor",
      "parameters": {
        "enable": true,
        "duration": 300
      },
      "delay": 0,
      "result": {
        "message": "5분간 음소거되었습니다.",
        "visibility": "private"
      }
    },
    {
      "type": "move_voice_channel",
      "target": "executor",
      "parameters": {
        "channelId": "afk_channel_id"
      },
      "delay": 300,
      "result": {
        "message": "AFK 채널로 이동되었습니다.",
        "visibility": "private"
      }
    }
  ],
  "buttonSettings": {
    "style": "secondary",
    "disableAfterUse": false
  },
  "options": {
    "oncePerUser": false,
    "logEnabled": true
  }
}
```

### 3.5 채널 권한 관리 버튼
```json
{
  "trigger": {
    "type": "role",
    "roles": ["moderator_role_id"],
    "users": []
  },
  "conditions": {
    "cooldownSeconds": 0,
    "oncePerUser": false
  },
  "actions": [
    {
      "type": "set_channel_permission",
      "target": "role",
      "parameters": {
        "channelId": ["text_channel_1", "text_channel_2"],
        "permissions": ["VIEW_CHANNEL", "SEND_MESSAGES"],
        "targetRoleId": "member_role_id"
      },
      "delay": 0,
      "result": {
        "message": "채널 권한이 설정되었습니다.",
        "visibility": "current_channel"
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

## 4. Discord 봇 액션 처리기 아키텍처

### 4.1 액션 처리기 인터페이스
```javascript
// /bot/Response/ActionExecutors/BaseActionExecutor.js
class BaseActionExecutor {
  constructor(type) {
    this.type = type;
    this.requiredPermissions = [];
    this.supportedTargets = ['executor'];
    this.retryable = false;
  }

  async validate(action, context) {
    if (!action.type) throw new Error('액션 타입이 없습니다.');
    if (!action.parameters) throw new Error('액션 파라미터가 없습니다.');
    if (!this.supportedTargets.includes(action.target)) {
      throw new Error(`지원하지 않는 대상: ${action.target}`);
    }
  }

  async checkPermissions(context) {
    for (const permission of this.requiredPermissions) {
      if (!context.member.permissions.has(permission)) {
        throw new Error(`필요 권한 없음: ${permission}`);
      }
    }
  }

  async execute(action, context) {
    await this.validate(action, context);
    await this.checkPermissions(context);
    return await this.performAction(action, context);
  }

  async performAction(action, context) {
    throw new Error('performAction 메서드를 구현해야 합니다.');
  }

  async rollback(action, context, executionResult) {
    // 기본적으로 롤백 불가능
    return { success: false, reason: 'rollback_not_supported' };
  }
}
```

### 4.2 액션 실행 엔진
```javascript
// /bot/Response/ButtonAutomationHandler.js
class ButtonAutomationEngine {
  constructor() {
    this.executors = new Map();
    this.executionQueue = [];
    this.isProcessing = false;
    this.registerExecutors();
  }

  registerExecutors() {
    // 역할 관리
    this.executors.set('add_role', new RoleActionExecutor('add_role'));
    this.executors.set('remove_role', new RoleActionExecutor('remove_role'));
    this.executors.set('toggle_role', new RoleActionExecutor('toggle_role'));
    
    // 닉네임 관리
    this.executors.set('change_nickname', new NicknameActionExecutor('change_nickname'));
    this.executors.set('reset_nickname', new NicknameActionExecutor('reset_nickname'));
    
    // 메시지 전송
    this.executors.set('send_message', new MessageActionExecutor('send_message'));
    this.executors.set('send_dm', new MessageActionExecutor('send_dm'));
    
    // 음성 채널 관리
    this.executors.set('move_voice_channel', new VoiceActionExecutor('move_voice_channel'));
    this.executors.set('disconnect_voice', new VoiceActionExecutor('disconnect_voice'));
    this.executors.set('set_voice_mute', new VoiceActionExecutor('set_voice_mute'));
    this.executors.set('set_voice_deafen', new VoiceActionExecutor('set_voice_deafen'));
    this.executors.set('toggle_voice_mute', new VoiceActionExecutor('toggle_voice_mute'));
    this.executors.set('toggle_voice_deafen', new VoiceActionExecutor('toggle_voice_deafen'));
    this.executors.set('set_priority_speaker', new VoiceActionExecutor('set_priority_speaker'));
    
    // 채널 권한 관리
    this.executors.set('set_channel_permission', new ChannelPermissionExecutor('set_channel_permission'));
    this.executors.set('remove_channel_permission', new ChannelPermissionExecutor('remove_channel_permission'));
    this.executors.set('override_channel_permission', new ChannelPermissionExecutor('override_channel_permission'));
    this.executors.set('reset_channel_permission', new ChannelPermissionExecutor('reset_channel_permission'));
    
    // 서버 권한 관리
    this.executors.set('grant_server_permission', new ServerPermissionExecutor('grant_server_permission'));
    this.executors.set('revoke_server_permission', new ServerPermissionExecutor('revoke_server_permission'));
    
    // 모더레이션
    this.executors.set('timeout_user', new ModerationExecutor('timeout_user'));
    this.executors.set('remove_timeout', new ModerationExecutor('remove_timeout'));
    
    // 음악
    this.executors.set('play_music', new MusicActionExecutor('play_music'));
    this.executors.set('stop_music', new MusicActionExecutor('stop_music'));
    this.executors.set('pause_music', new MusicActionExecutor('pause_music'));
  }

  async executeActions(actions, context) {
    const executionId = `${context.buttonId}_${Date.now()}`;
    const execution = {
      id: executionId,
      actions,
      context,
      results: [],
      status: 'pending',
      startTime: Date.now()
    };

    try {
      execution.status = 'running';
      
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        
        // 지연 처리
        if (action.delay > 0) {
          await this.delay(action.delay * 1000);
        }
        
        // 액션 실행
        const result = await this.executeAction(action, context);
        execution.results[i] = result;
        
        // 실패 시 중단 여부 결정
        if (!result.success && !result.continuable) {
          execution.status = 'failed';
          break;
        }
        
        // 결과 메시지 전송
        if (action.result && action.result.message) {
          await this.sendResultMessage(action.result, context, result);
        }
      }
      
      if (execution.status !== 'failed') {
        execution.status = 'completed';
      }
      
    } catch (error) {
      execution.status = 'error';
      execution.error = error.message;
      console.error('액션 실행 오류:', error);
    }
    
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;
    
    return execution;
  }

  async executeAction(action, context) {
    const executor = this.executors.get(action.type);
    if (!executor) {
      return {
        success: false,
        error: `지원하지 않는 액션 타입: ${action.type}`,
        continuable: false
      };
    }

    try {
      const result = await executor.execute(action, context);
      return {
        success: true,
        result,
        continuable: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        continuable: executor.retryable
      };
    }
  }

  async sendResultMessage(resultConfig, context, actionResult) {
    if (!resultConfig.message || resultConfig.visibility === 'none') {
      return;
    }

    const message = this.processMessageVariables(resultConfig.message, context, actionResult);
    
    switch (resultConfig.visibility) {
      case 'private':
        await context.user.send(message);
        break;
      case 'current_channel':
        await context.channel.send(message);
        break;
      case 'specific_channel':
        if (resultConfig.channelId) {
          const channel = await context.guild.channels.fetch(resultConfig.channelId);
          await channel.send(message);
        }
        break;
    }
  }

  processMessageVariables(message, context, actionResult) {
    return message
      .replace(/{user}/g, `<@${context.user.id}>`)
      .replace(/{username}/g, context.user.username)
      .replace(/{guild}/g, context.guild.name)
      .replace(/{channel}/g, `<#${context.channel.id}>`)
      .replace(/{button}/g, context.buttonLabel || '버튼');
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4.3 역할 액션 실행기
```javascript
// /bot/Response/ActionExecutors/RoleActionExecutor.js
const { BaseActionExecutor } = require('./BaseActionExecutor');

class RoleActionExecutor extends BaseActionExecutor {
  constructor(type) {
    super(type);
    this.requiredPermissions = ['MANAGE_ROLES'];
    this.supportedTargets = ['executor', 'specific', 'role', 'all'];
    this.retryable = true;
  }

  async performAction(action, context) {
    const targets = await this.resolveTargets(action, context);
    const role = await context.guild.roles.fetch(action.parameters.roleId);
    
    if (!role) {
      throw new Error('역할을 찾을 수 없습니다.');
    }

    const results = [];
    
    for (const member of targets) {
      try {
        let result;
        switch (action.type) {
          case 'add_role':
            await member.roles.add(role);
            result = { success: true, action: 'added', member: member.id };
            break;
          case 'remove_role':
            await member.roles.remove(role);
            result = { success: true, action: 'removed', member: member.id };
            break;
          case 'toggle_role':
            if (member.roles.cache.has(role.id)) {
              await member.roles.remove(role);
              result = { success: true, action: 'removed', member: member.id };
            } else {
              await member.roles.add(role);
              result = { success: true, action: 'added', member: member.id };
            }
            break;
        }
        results.push(result);
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          member: member.id 
        });
      }
    }

    return {
      type: action.type,
      roleId: role.id,
      roleName: role.name,
      results,
      successCount: results.filter(r => r.success).length,
      totalCount: results.length
    };
  }

  async resolveTargets(action, context) {
    switch (action.target) {
      case 'executor':
        return [context.member];
      case 'specific':
        const user = await context.guild.members.fetch(action.parameters.targetUserId);
        return [user];
      case 'role':
        const targetRole = await context.guild.roles.fetch(action.parameters.targetRoleId);
        return targetRole.members.values();
      case 'all':
        return context.guild.members.cache.values();
      default:
        throw new Error(`지원하지 않는 대상: ${action.target}`);
    }
  }
}

module.exports = { RoleActionExecutor };
```

## 5. 이벤트 핸들러 및 캐시 무효화 시스템

### 5.1 채널 이벤트 핸들러
```javascript
// /bot/Events/Guild/channelCreate.js
const { invalidateChannelCache } = require('../../Commands/api/automation/cacheApi');

module.exports = {
  name: 'channelCreate',
  async execute(channel) {
    try {
      await invalidateChannelCache(channel.guild.id);
      console.log(`채널 생성 감지: ${channel.name} (${channel.id}) - 캐시 무효화 완료`);
    } catch (error) {
      console.error('채널 생성 캐시 무효화 실패:', error);
    }
  }
};

// /bot/Events/Guild/channelUpdate.js
module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel) {
    try {
      await invalidateChannelCache(newChannel.guild.id);
      console.log(`채널 수정 감지: ${newChannel.name} (${newChannel.id}) - 캐시 무효화 완료`);
    } catch (error) {
      console.error('채널 수정 캐시 무효화 실패:', error);
    }
  }
};

// /bot/Events/Guild/channelDelete.js
module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    try {
      await invalidateChannelCache(channel.guild.id);
      console.log(`채널 삭제 감지: ${channel.name} (${channel.id}) - 캐시 무효화 완료`);
    } catch (error) {
      console.error('채널 삭제 캐시 무효화 실패:', error);
    }
  }
};
```

### 5.2 역할 이벤트 핸들러
```javascript
// /bot/Events/Guild/roleCreate.js
const { invalidateRoleCache } = require('../../Commands/api/automation/cacheApi');

module.exports = {
  name: 'roleCreate',
  async execute(role) {
    try {
      await invalidateRoleCache(role.guild.id);
      console.log(`역할 생성 감지: ${role.name} (${role.id}) - 캐시 무효화 완료`);
    } catch (error) {
      console.error('역할 생성 캐시 무효화 실패:', error);
    }
  }
};

// /bot/Events/Guild/roleUpdate.js
module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole) {
    try {
      await invalidateRoleCache(newRole.guild.id);
      console.log(`역할 수정 감지: ${newRole.name} (${newRole.id}) - 캐시 무효화 완료`);
    } catch (error) {
      console.error('역할 수정 캐시 무효화 실패:', error);
    }
  }
};

// /bot/Events/Guild/roleDelete.js
module.exports = {
  name: 'roleDelete',
  async execute(role) {
    try {
      await invalidateRoleCache(role.guild.id);
      console.log(`역할 삭제 감지: ${role.name} (${role.id}) - 캐시 무효화 완료`);
    } catch (error) {
      console.error('역할 삭제 캐시 무효화 실패:', error);
    }
  }
};
```

### 5.3 캐시 API 클라이언트
```javascript
// /bot/Commands/api/automation/cacheApi.js
const axios = require('axios');
const config = require('../../../config.json');

const cacheApi = axios.create({
  baseURL: config.backend.baseUrl,
  timeout: 5000,
  headers: {
    'Authorization': `Bot ${config.bot.token}`,
    'Content-Type': 'application/json'
  }
});

async function invalidateChannelCache(guildId) {
  try {
    const response = await cacheApi.delete(`/api/v1/auth/guilds/cache/channels/${guildId}`);
    return response.data;
  } catch (error) {
    console.error(`채널 캐시 무효화 실패 (${guildId}):`, error.response?.data || error.message);
    throw error;
  }
}

async function invalidateRoleCache(guildId) {
  try {
    const response = await cacheApi.delete(`/api/v1/auth/guilds/cache/roles/${guildId}`);
    return response.data;
  } catch (error) {
    console.error(`역할 캐시 무효화 실패 (${guildId}):`, error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  invalidateChannelCache,
  invalidateRoleCache
};
```

## 6. 단계별 구현 계획

### Phase 1: 기반 구조 구축 (1주)
**목표**: 액션 처리기 기본 인터페이스와 실행 엔진 구현

#### 1.1 기본 구조 생성
- [ ] `BaseActionExecutor.js` 인터페이스 구현
- [ ] `ButtonAutomationEngine.js` 실행 엔진 구현
- [ ] 액션 실행기 레지스트리 시스템 구현
- [ ] 기본 에러 처리 및 로깅 시스템

#### 1.2 핵심 액션 실행기 3개 구현
- [ ] `RoleActionExecutor.js` (add_role, remove_role, toggle_role)
- [ ] `MessageActionExecutor.js` (send_message, send_dm)
- [ ] `MusicActionExecutor.js` (play_music, stop_music, pause_music)

#### 1.3 테스트 및 검증
- [ ] 기본 액션 실행 테스트
- [ ] 에러 처리 시나리오 테스트
- [ ] 성능 및 메모리 사용량 검증

### Phase 2: 핵심 액션 확장 (2주)
**목표**: 모든 주요 액션 타입 구현 완료

#### 2.1 음성 채널 관리 (3일)
- [ ] `VoiceActionExecutor.js` 구현
  - [ ] move_voice_channel
  - [ ] disconnect_voice
  - [ ] set_voice_mute, set_voice_deafen
  - [ ] toggle_voice_mute, toggle_voice_deafen
  - [ ] set_priority_speaker

#### 2.2 닉네임 관리 (2일)
- [ ] `NicknameActionExecutor.js` 구현
  - [ ] change_nickname
  - [ ] reset_nickname
  - [ ] 변수 치환 시스템 ({username}, {user} 등)

#### 2.3 권한 관리 (4일)
- [ ] `ChannelPermissionExecutor.js` 구현
  - [ ] set_channel_permission
  - [ ] remove_channel_permission
  - [ ] override_channel_permission
  - [ ] reset_channel_permission
- [ ] `ServerPermissionExecutor.js` 구현
  - [ ] grant_server_permission
  - [ ] revoke_server_permission

#### 2.4 모더레이션 (2일)
- [ ] `ModerationExecutor.js` 구현
  - [ ] timeout_user
  - [ ] remove_timeout

#### 2.5 통합 테스트 (3일)
- [ ] 전체 액션 타입 통합 테스트
- [ ] 복합 액션 시나리오 테스트
- [ ] 성능 최적화

### Phase 3: 고급 기능 및 시스템 통합 (2주)
**목표**: 캐시 무효화, 이벤트 핸들러, 고급 기능 구현

#### 3.1 캐시 무효화 시스템 (3일)
- [ ] 이벤트 핸들러 구현
  - [ ] channelCreate/Update/Delete.js
  - [ ] roleCreate/Update/Delete.js
- [ ] `cacheApi.js` 클라이언트 구현
- [ ] 배치 처리 시스템 구현

#### 3.2 고급 액션 실행 기능 (4일)
- [ ] 액션 실행 추적 시스템
- [ ] 재시도 메커니즘
- [ ] 부분 롤백 기능
- [ ] 실행 결과 상세 로깅

#### 3.3 성능 최적화 (3일)
- [ ] 액션 실행기 인스턴스 풀링
- [ ] 메모리 사용량 최적화
- [ ] Discord API 레이트 리밋 관리
- [ ] 비동기 처리 최적화

#### 3.4 사용자 경험 개선 (4일)
- [ ] 상세한 에러 메시지 시스템
- [ ] 실행 진행 상황 알림
- [ ] 관리자용 실행 통계 대시보드
- [ ] 디버깅 도구

### Phase 4: 안정화 및 배포 (1주)
**목표**: 시스템 안정화 및 운영 환경 배포

#### 4.1 종합 테스트 (3일)
- [ ] 전체 기능 통합 테스트
- [ ] 부하 테스트
- [ ] 장애 복구 테스트
- [ ] 보안 검증

#### 4.2 문서화 및 배포 (2일)
- [ ] API 문서 작성
- [ ] 운영 가이드 작성
- [ ] 배포 스크립트 작성
- [ ] 모니터링 시스템 구축

#### 4.3 최종 최적화 (2일)
- [ ] 성능 튜닝
- [ ] 메모리 누수 점검
- [ ] 로그 시스템 최적화
- [ ] 운영 환경 설정 확정

## 7. 기술적 고려사항

### 7.1 성능 최적화
- **액션 실행기 풀링**: 인스턴스 재사용으로 메모리 효율성 향상
- **비동기 처리**: Promise.all 활용한 병렬 처리
- **캐시 최적화**: Redis 기반 캐시 무효화 배치 처리
- **메모리 관리**: 대용량 실행 기록 관리

### 7.2 확장성
- **플러그인 아키텍처**: 새로운 액션 타입 쉬운 추가
- **설정 기반 동작**: JSON 설정으로 동작 방식 변경
- **모듈화 설계**: 각 액션 실행기 독립적 개발 가능
- **API 버전 관리**: 하위 호환성 보장

### 7.3 안정성
- **트랜잭션 처리**: 부분 실패 시 안전한 복구
- **에러 격리**: 한 액션 실패가 전체에 영향 없음
- **상태 일관성**: Discord와 백엔드 데이터 동기화
- **감사 로그**: 모든 액션 실행 기록

### 7.4 보안
- **권한 검증**: 프론트엔드-백엔드-봇 삼중 검증
- **Rate Limiting**: 액션 실행 빈도 제한
- **입력 검증**: 모든 파라미터 유효성 검사
- **로그 보안**: 민감 정보 마스킹

이 설계 문서를 기반으로 체계적이고 확장 가능한 Discord 자동화 시스템을 구축할 수 있습니다.

---

## 📊 실제 구현 현황 분석 결과 (2025-01-21)

### 🔍 **프론트엔드 완성도 조사**
분석 결과, 프론트엔드에는 **22개의 액션 타입**이 완전히 구현되어 있으며, 계획서보다 훨씬 더 많은 기능이 있었습니다!

#### **실제 구현된 액션 타입 (22개)**

##### **역할 관리 (3개)**
- `add_role` - 역할 추가 (MANAGE_ROLES 권한 필요)
- `remove_role` - 역할 제거 (MANAGE_ROLES 권한 필요)  
- `toggle_role` - 역할 토글 (MANAGE_ROLES 권한 필요)

##### **닉네임 관리 (2개)**
- `change_nickname` - 닉네임 변경 (MANAGE_NICKNAMES 권한 필요)
- `reset_nickname` - 닉네임 초기화 (MANAGE_NICKNAMES 권한 필요)

##### **메시지 관리 (2개)**
- `send_message` - 채널 메시지 전송 (SEND_MESSAGES 권한 필요)
- `send_dm` - DM 전송 (권한 불필요)

##### **음성 채널 관리 (2개)**
- `move_voice_channel` - 음성 채널 이동 (MOVE_MEMBERS 권한 필요)
- `disconnect_voice` - 음성 연결 해제 (MOVE_MEMBERS 권한 필요)

##### **음성 제어 (5개)**
- `set_voice_mute` - 마이크 음소거 (MUTE_MEMBERS 권한 필요)
- `set_voice_deafen` - 스피커 차단 (DEAFEN_MEMBERS 권한 필요)
- `toggle_voice_mute` - 마이크 토글 (MUTE_MEMBERS 권한 필요)
- `toggle_voice_deafen` - 스피커 토글 (DEAFEN_MEMBERS 권한 필요)
- `set_priority_speaker` - 우선 발언자 설정 (PRIORITY_SPEAKER 권한 필요)

##### **채널 권한 관리 (4개)**
- `set_channel_permission` - 채널 권한 설정 (MANAGE_CHANNELS 권한 필요)
- `remove_channel_permission` - 채널 권한 제거 (MANAGE_CHANNELS 권한 필요)  
- `override_channel_permission` - 채널 권한 오버라이드 (MANAGE_CHANNELS 권한 필요)
- `reset_channel_permission` - 채널 권한 초기화 (MANAGE_CHANNELS 권한 필요)

##### **모더레이션 (1개)**
- `remove_timeout` - 타임아웃 해제 (MODERATE_MEMBERS 권한 필요)

##### **음악 관리 (3개)**
- `play_music` - 음악 재생 (CONNECT, SPEAK 권한 필요)
- `stop_music` - 음악 정지 (CONNECT, SPEAK 권한 필요)
- `pause_music` - 음악 일시정지/재개 (CONNECT, SPEAK 권한 필요)

#### **고급 시스템 기능들**

##### **조건(Conditions) 시스템**
1. **필수 역할 (requiredRoles)**: 특정 역할을 가진 사용자만 사용 가능
2. **차단 역할 (deniedRoles)**: 특정 역할을 가진 사용자는 사용 불가
3. **특정 채널 (requiredChannels)**: 지정된 채널에서만 사용 가능
4. **쿨다운 (cooldownSeconds)**: 사용 후 재사용까지 대기시간
5. **사용자별 제한 (oncePerUser)**: 사용자당 1회만 사용 가능

##### **트리거(Trigger) 시스템**
1. **everyone**: 모든 사람이 사용 가능
2. **role**: 특정 역할만 사용 가능
3. **admin**: 관리자만 사용 가능

##### **대상(Target) 시스템**
1. **executor**: 버튼을 누른 사람
2. **all**: 모든 사람
3. **role**: 특정 역할의 모든 사용자 (다중 역할 선택 지원 필요)
4. **specific**: 특정 사용자

##### **고급 UI 기능들**
- **MusicParameterEditor**: 음악 전용 에디터
- **MusicSelector**: 음악 파일 선택 컴포넌트
- **MultiRoleSelect**: 다중 역할 선택 (개선 필요)
- **MultiChannelSelect**: 다중 채널 선택 (채널 타입별 필터링)
- **드래그 앤 드롭**: 액션 순서 변경
- **TestRunner**: 버튼 동작 시뮬레이션
- **실시간 미리보기**: JSON → 사용자 친화적 텍스트 변환

### ⚠️ **발견된 개선 필요 사항**

#### **1. 대상 역할 선택 멀티셀렉 미지원**
- **문제**: `target: "role"`일 때 `targetRoleId`가 단일 선택만 지원
- **개선**: 다중 역할 선택 지원으로 여러 역할 대상 액션 가능
- **영향**: 복합 역할 기반 액션 제한

#### **2. 권한 시스템 고도화**
- **현재**: 53개 Discord 권한 완전 매핑됨
- **개선**: 채널 타입별 권한 필터링 완료
- **상태**: 이미 구현됨

#### **3. 음악 시스템 복잡도**
- **현재**: 고도화된 MusicParameterEditor 구현
- **특징**: source, trackId, volume, stopBehavior 등 복합 파라미터
- **상태**: 프론트엔드 완성, 봇 통합 필요

## 🚀 수정된 구현 계획 (4주)

### **우선 개선 작업**: 대상 역할 멀티셀렉 지원
- **문제 해결**: ActionEditor에서 target="role" 시 다중 역할 선택 지원
- **구현**: `targetRoleId` → `targetRoleIds` (배열) 변경
- **UI 개선**: MultiRoleSelect 컴포넌트 maxSelections 제한 해제

### **Phase 1: 핵심 액션 처리기 구현 (1주)**
**목표**: 주요 액션 타입별 전용 처리기 구현

#### **1.1 기반 구조 (2일)**
- [ ] `BaseActionExecutor.js` 추상 클래스 구현
- [ ] `ButtonAutomationEngine.js` 실행 엔진 구현
- [ ] 액션 실행기 레지스트리 시스템
- [ ] 대상 해석 시스템 (executor, all, role[], specific)

#### **1.2 핵심 실행기 구현 (3일)**
- [ ] `RoleActionExecutor.js` (add_role, remove_role, toggle_role)
- [ ] `MessageActionExecutor.js` (send_message, send_dm)
- [ ] `NicknameActionExecutor.js` (change_nickname, reset_nickname)
- [ ] `VoiceActionExecutor.js` (7개 음성 관련 액션)
- [ ] `MusicActionExecutor.js` (기존 음악 시스템 개선)

### **Phase 2: 권한 및 모더레이션 (1주)**
**목표**: 고급 권한 관리 및 모더레이션 기능 구현

#### **2.1 권한 관리 (4일)**
- [ ] `ChannelPermissionExecutor.js` (4개 채널 권한 액션)
- [ ] Discord 53개 권한 매핑 시스템
- [ ] 채널 타입별 권한 필터링 (text/voice/category)
- [ ] 다중 채널 권한 설정 지원

#### **2.2 모더레이션 (2일)**
- [ ] `ModerationExecutor.js` (remove_timeout)
- [ ] 추가 모더레이션 액션 (timeout_user 등) 확장 준비

#### **2.3 통합 테스트 (1일)**
- [ ] 전체 액션 타입 통합 테스트
- [ ] 권한 검증 시스템 테스트

### **Phase 3: 시스템 통합 및 고급 기능 (1주)**
**목표**: 캐시 무효화, 조건/트리거 처리, 고급 기능 구현

#### **3.1 캐시 무효화 시스템 (3일)**
- [ ] Discord 이벤트 핸들러 (channelCreate/Update/Delete)
- [ ] Discord 이벤트 핸들러 (roleCreate/Update/Delete)
- [ ] `cacheApi.js` 백엔드 캐시 무효화 클라이언트
- [ ] 배치 처리 시스템 (중복 요청 최적화)

#### **3.2 조건/트리거 시스템 (2일)**
- [ ] 조건 검증 시스템 (5가지 조건 타입)
- [ ] 트리거 검증 시스템 (3가지 트리거 타입)
- [ ] 복합 조건 처리 로직

#### **3.3 고급 실행 기능 (2일)**
- [ ] 변수 치환 시스템 ({user}, {username}, {guild}, {channel}, {button})
- [ ] 액션 실행 추적 및 로깅
- [ ] 지연(delay) 처리 시스템
- [ ] 결과 메시지 처리 (4가지 visibility 타입)

### **Phase 4: 최적화 및 안정화 (1주)**
**목표**: 성능 최적화, 에러 처리 강화, 운영 환경 준비

#### **4.1 성능 최적화 (3일)**
- [ ] 액션 실행기 인스턴스 풀링
- [ ] 메모리 사용량 최적화
- [ ] Discord API 레이트 리밋 관리
- [ ] 비동기 처리 최적화

#### **4.2 에러 처리 강화 (2일)**
- [ ] 액션별 독립적 에러 처리
- [ ] 재시도 메커니즘 (retryable 액션 구분)
- [ ] 부분 실행 상태 복구
- [ ] 상세 에러 로깅 시스템

#### **4.3 운영 환경 준비 (2일)**
- [ ] 종합 테스트 (부하 테스트, 장애 복구 테스트)
- [ ] 모니터링 시스템 구축
- [ ] 문서화 (API 문서, 운영 가이드)
- [ ] 배포 스크립트 및 설정 확정

## 🎯 핵심 구현 목표 (수정됨)

### **1. 완전한 액션 처리 시스템**
- 22개 액션 타입 모든 봇 처리기 구현
- 다중 대상 지원 (특히 role 타겟의 다중 역할 선택)
- 순차적 실행 보장 (delay 시간 준수)

### **2. 고급 권한 관리**
- 53개 Discord 권한 완전 매핑
- 채널 타입별 스마트 권한 필터링
- 다중 채널 권한 설정 지원

### **3. 실시간 캐시 동기화**
- Discord 이벤트 기반 캐시 무효화
- 배치 처리로 API 호출 최적화
- 프론트엔드-백엔드 데이터 일관성 보장

### **4. 확장 가능한 아키텍처**
- 모듈화된 액션 실행기 구조
- 새로운 액션 타입 쉬운 추가
- 플러그인 방식 확장 지원

### **5. 안정적인 운영 환경**
- 강화된 에러 처리 및 복구 시스템
- 성능 모니터링 및 최적화
- 완전한 테스트 커버리지

## 📋 즉시 수행할 개선 작업

### **우선순위 1: 대상 역할 멀티셀렉 지원**
1. ActionEditor에서 target="role" 시 다중 역할 선택 UI 개선
2. `targetRoleId` → `targetRoleIds` 배열 구조 변경
3. 봇 처리기에서 다중 역할 대상 처리 로직 구현

이 수정된 계획으로 **4주간** 체계적인 구현을 통해 완전한 Discord 자동화 시스템을 구축하겠습니다.