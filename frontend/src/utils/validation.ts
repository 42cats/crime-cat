// 폼 유효성 검증 유틸리티 함수들

export const validationRules = {
  // 그룹 이름 검증
  groupName: [
    { required: true, message: '그룹 이름을 입력해주세요.' },
    { min: 1, max: 100, message: '그룹 이름은 1-100자 사이로 입력해주세요.' },
    { 
      pattern: /^[^\s].*[^\s]$|^[^\s]$/, 
      message: '그룹 이름의 앞뒤 공백은 허용되지 않습니다.' 
    }
  ],

  // 버튼 라벨 검증
  buttonLabel: [
    { required: true, message: '버튼 텍스트를 입력해주세요.' },
    { min: 1, max: 80, message: '버튼 텍스트는 1-80자 사이로 입력해주세요.' },
    {
      pattern: /^[^\s].*[^\s]$|^[^\s]$/,
      message: '버튼 텍스트의 앞뒤 공백은 허용되지 않습니다.'
    }
  ],

  // 표시 순서 검증
  displayOrder: [
    { type: 'number', min: 0, max: 999, message: '표시 순서는 0-999 사이의 숫자여야 합니다.' }
  ],

  // 메시지 내용 검증
  messageContent: [
    { max: 2000, message: '메시지 내용은 2000자 이하로 입력해주세요.' }
  ],

  // 임베드 제목 검증
  embedTitle: [
    { max: 256, message: '임베드 제목은 256자 이하로 입력해주세요.' }
  ],

  // 임베드 설명 검증
  embedDescription: [
    { max: 4096, message: '임베드 설명은 4096자 이하로 입력해주세요.' }
  ],

  // Discord ID 검증 (Role, Channel, User ID)
  discordId: [
    {
      pattern: /^\d{17,19}$/,
      message: 'Discord ID는 17-19자리 숫자여야 합니다.'
    }
  ],

  // 쿨다운 시간 검증
  cooldown: [
    { type: 'number', min: 0, max: 86400, message: '쿨다운은 0-86400초(24시간) 사이여야 합니다.' }
  ],

  // 지연 시간 검증
  delay: [
    { type: 'number', min: 0, max: 3600, message: '지연 시간은 0-3600초(1시간) 사이여야 합니다.' }
  ],

  // 닉네임 검증
  nickname: [
    { max: 32, message: '닉네임은 32자 이하로 입력해주세요.' }
  ],

  // 결과 메시지 검증
  resultMessage: [
    { max: 2000, message: '결과 메시지는 2000자 이하로 입력해주세요.' }
  ]
};

// Discord Snowflake ID 검증
export const isValidDiscordId = (id: string): boolean => {
  return /^\d{17,19}$/.test(id);
};

// 이모지 검증 (기본적인 유니코드 이모지 또는 Discord 커스텀 이모지)
export const isValidEmoji = (emoji: string): boolean => {
  if (!emoji) return false;
  
  // 유니코드 이모지 패턴
  const unicodeEmojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  
  // Discord 커스텀 이모지 패턴 <:name:id> 또는 <a:name:id>
  const discordEmojiPattern = /^<a?:\w+:\d{17,19}>$/;
  
  // 기본 이모지 (한글자)
  const basicEmojiPattern = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/gu;
  
  return basicEmojiPattern.test(emoji) || 
         discordEmojiPattern.test(emoji) ||
         unicodeEmojiPattern.test(emoji);
};

// JSON 문자열 검증
export const isValidJson = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
};

// 색상 코드 검증 (hex)
export const isValidColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// 버튼 설정 검증
export const validateButtonConfig = (config: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!isValidJson(config)) {
    errors.push('올바른 JSON 형식이 아닙니다.');
    return { isValid: false, errors };
  }
  
  try {
    const parsedConfig = JSON.parse(config);
    
    // 필수 필드 검증
    if (!parsedConfig.actions || !Array.isArray(parsedConfig.actions)) {
      errors.push('액션 배열이 필요합니다.');
    }
    
    if (!parsedConfig.trigger || typeof parsedConfig.trigger !== 'object') {
      errors.push('트리거 설정이 필요합니다.');
    }
    
    // 액션 검증
    if (parsedConfig.actions) {
      parsedConfig.actions.forEach((action: any, index: number) => {
        if (!action.type) {
          errors.push(`액션 ${index + 1}: 액션 타입이 필요합니다.`);
        }
        
        if (action.parameters) {
          // 역할 ID 검증
          if (action.parameters.roleId && !isValidDiscordId(action.parameters.roleId)) {
            errors.push(`액션 ${index + 1}: 올바른 역할 ID가 아닙니다.`);
          }
          
          // 채널 ID 검증
          if (action.parameters.channelId && !isValidDiscordId(action.parameters.channelId)) {
            errors.push(`액션 ${index + 1}: 올바른 채널 ID가 아닙니다.`);
          }
          
          // 닉네임 길이 검증
          if (action.parameters.nickname && action.parameters.nickname.length > 32) {
            errors.push(`액션 ${index + 1}: 닉네임은 32자 이하여야 합니다.`);
          }
        }
      });
    }
    
    return { isValid: errors.length === 0, errors };
  } catch (error) {
    errors.push('설정 검증 중 오류가 발생했습니다.');
    return { isValid: false, errors };
  }
};

// 그룹 설정 검증
export const validateGroupSettings = (settings: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!settings) {
    return { isValid: true, errors }; // 설정이 없어도 유효
  }
  
  if (!isValidJson(settings)) {
    errors.push('올바른 JSON 형식이 아닙니다.');
    return { isValid: false, errors };
  }
  
  try {
    const parsedSettings = JSON.parse(settings);
    
    // 메시지 설정 검증
    if (parsedSettings.messageConfig) {
      const messageConfig = parsedSettings.messageConfig;
      
      if (messageConfig.content && messageConfig.content.length > 2000) {
        errors.push('메시지 내용은 2000자 이하여야 합니다.');
      }
      
      if (messageConfig.emojis && Array.isArray(messageConfig.emojis)) {
        messageConfig.emojis.forEach((emoji: string, index: number) => {
          if (emoji && !isValidEmoji(emoji)) {
            errors.push(`이모지 ${index + 1}이 올바르지 않습니다.`);
          }
        });
      }
      
      if (messageConfig.embed) {
        const embed = messageConfig.embed;
        
        if (embed.title && embed.title.length > 256) {
          errors.push('임베드 제목은 256자 이하여야 합니다.');
        }
        
        if (embed.description && embed.description.length > 4096) {
          errors.push('임베드 설명은 4096자 이하여야 합니다.');
        }
        
        if (embed.color && !isValidColor(embed.color)) {
          errors.push('올바른 색상 코드가 아닙니다.');
        }
      }
    }
    
    return { isValid: errors.length === 0, errors };
  } catch (error) {
    errors.push('설정 검증 중 오류가 발생했습니다.');
    return { isValid: false, errors };
  }
};

// Discord 제한사항 상수
export const DISCORD_LIMITS = {
  MAX_BUTTONS_PER_GROUP: 25, // Discord 한 메시지당 최대 버튼 수 (5행 x 5열)
  MAX_GROUPS_PER_GUILD: 50,  // 길드당 권장 최대 그룹 수
  MAX_ACTIONS_PER_BUTTON: 20, // 버튼당 최대 액션 수
  MAX_BUTTON_LABEL_LENGTH: 80, // Discord 버튼 라벨 최대 길이
} as const;

// 그룹별 버튼 수 검증
export const validateButtonCount = (
  groupId: string | undefined, 
  currentButtons: any[], 
  isCreating: boolean = false
): { isValid: boolean; currentCount: number; maxCount: number; error?: string } => {
  const currentCount = groupId 
    ? currentButtons.filter(button => button.groupId === groupId).length 
    : 0;
  
  const maxCount = DISCORD_LIMITS.MAX_BUTTONS_PER_GROUP;
  
  if (isCreating && currentCount >= maxCount) {
    return {
      isValid: false,
      currentCount,
      maxCount,
      error: `그룹당 최대 ${maxCount}개의 버튼만 생성할 수 있습니다. (현재: ${currentCount}개)`
    };
  }
  
  return {
    isValid: true,
    currentCount,
    maxCount
  };
};

// 액션 수 검증
export const validateActionCount = (actions: any[]): { isValid: boolean; error?: string } => {
  const maxActions = DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON;
  
  if (actions.length > maxActions) {
    return {
      isValid: false,
      error: `버튼당 최대 ${maxActions}개의 액션만 설정할 수 있습니다. (현재: ${actions.length}개)`
    };
  }
  
  return { isValid: true };
};

// 폼 데이터 전체 검증
export const validateFormData = {
  group: (data: any): string[] => {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push('그룹 이름은 필수입니다.');
    } else if (data.name.length > 100) {
      errors.push('그룹 이름은 100자 이하여야 합니다.');
    }
    
    if (data.displayOrder !== undefined && (data.displayOrder < 0 || data.displayOrder > 999)) {
      errors.push('표시 순서는 0-999 사이여야 합니다.');
    }
    
    if (data.settings) {
      const settingsValidation = validateGroupSettings(JSON.stringify(data.settings));
      errors.push(...settingsValidation.errors);
    }
    
    return errors;
  },
  
  button: (data: any, actions: any[] = []): string[] => {
    const errors: string[] = [];
    
    if (!data.buttonLabel || data.buttonLabel.trim().length === 0) {
      errors.push('버튼 텍스트는 필수입니다.');
    } else if (data.buttonLabel.length > 80) {
      errors.push('버튼 텍스트는 80자 이하여야 합니다.');
    }
    
    if (data.displayOrder !== undefined && (data.displayOrder < 0 || data.displayOrder > 999)) {
      errors.push('표시 순서는 0-999 사이여야 합니다.');
    }
    
    if (!data.config) {
      errors.push('버튼 설정은 필수입니다.');
    } else {
      const configValidation = validateButtonConfig(data.config);
      errors.push(...configValidation.errors);
    }
    
    // 액션 수 검증
    if (actions.length > 0) {
      const actionValidation = validateActionCount(actions);
      if (!actionValidation.isValid && actionValidation.error) {
        errors.push(actionValidation.error);
      }
    }
    
    return errors;
  }
};