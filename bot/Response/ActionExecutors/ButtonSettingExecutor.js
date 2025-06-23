const { BaseActionExecutor } = require('./BaseActionExecutor');

/**
 * 버튼 설정 변경 액션 실행기
 * 액션 실행 후 버튼의 스타일, 라벨, 비활성화 상태 등을 변경
 */
class ButtonSettingExecutor extends BaseActionExecutor {
    static name = 'button_setting';
    
    constructor(type) {
        super(type);
        this.requiredPermissions = []; // 특별한 권한 불필요
        this.supportedTargets = ['executor']; // 버튼 설정 변경은 실행자 기준
        this.retryable = true;
        this.rollbackable = false; // 버튼 상태 변경은 롤백 불가
    }

    /**
     * 버튼 설정 변경 액션 실행
     */
    async performAction(action, context) {
        const { buttonStyle, buttonLabel, buttonDisabled, buttonEmoji } = action.parameters;

        if (!buttonStyle && !buttonLabel && buttonDisabled === undefined && !buttonEmoji) {
            throw new Error('변경할 버튼 설정이 지정되지 않았습니다.');
        }

        const result = {
            success: true,
            changes: {},
            summary: '버튼 설정이 변경되었습니다.'
        };

        try {
            // 버튼 메시지 조회
            const message = context.channel.messages.cache.get(context.messageId) || 
                           await context.channel.messages.fetch(context.messageId);

            if (!message || !message.components || message.components.length === 0) {
                throw new Error('버튼을 포함한 메시지를 찾을 수 없습니다.');
            }

            // 기존 컴포넌트 복사 (Discord.js v14 호환)
            const newComponents = message.components.map(row => {
                const newRow = { type: 1, components: [] };
                
                row.components.forEach(component => {
                    // Discord.js v14에서 컴포넌트 데이터 구조 처리
                    const componentData = component.data || component;
                    
                    if (componentData.type === 2) { // 버튼인 경우
                        const newButton = { ...componentData };
                        
                        // 현재 실행된 버튼인지 확인 (customId로 구분)
                        const buttonId = this.extractButtonId(componentData.custom_id || componentData.customId);
                        const currentButtonId = this.extractButtonId(context.customId || '');
                        
                        // 디버그 출력은 오류 시에만
                        
                        if (buttonId === currentButtonId) {
                            // 스타일 변경
                            if (buttonStyle) {
                                const styleMap = {
                                    'primary': 1,
                                    'secondary': 2,
                                    'success': 3,
                                    'danger': 4
                                };
                                newButton.style = styleMap[buttonStyle] || 1;
                                result.changes.style = buttonStyle;
                            }

                            // 라벨 변경 (변수 처리)
                            if (buttonLabel) {
                                const processedLabel = this.processMessageVariables(buttonLabel, context);
                                newButton.label = processedLabel;
                                result.changes.label = processedLabel;
                            }

                            // 비활성화 상태 변경
                            if (buttonDisabled !== undefined) {
                                newButton.disabled = buttonDisabled;
                                result.changes.disabled = buttonDisabled;
                            }

                            // 이모지 변경
                            if (buttonEmoji) {
                                // Unicode 이모지 또는 Discord 커스텀 이모지 처리
                                if (buttonEmoji.startsWith('<:') && buttonEmoji.endsWith('>')) {
                                    // 커스텀 이모지: <:name:id> 형식
                                    const match = buttonEmoji.match(/<:(\w+):(\d+)>/);
                                    if (match) {
                                        newButton.emoji = {
                                            name: match[1],
                                            id: match[2]
                                        };
                                    }
                                } else {
                                    // Unicode 이모지
                                    newButton.emoji = { name: buttonEmoji };
                                }
                                result.changes.emoji = buttonEmoji;
                            }
                        }
                        
                        newRow.components.push(newButton);
                    } else {
                        newRow.components.push(componentData);
                    }
                });
                
                return newRow;
            });

            // 메시지 수정
            await message.edit({ components: newComponents });

            console.log(`✅ [버튼설정] 버튼 설정 변경 완료:`, result.changes);
            
            return result;

        } catch (error) {
            console.error(`❌ [버튼설정] 버튼 설정 변경 실패:`, error);
            console.error(`❌ [버튼설정] 에러 스택:`, error.stack);
            
            // 상세한 디버그 정보 출력
            console.error(`❌ [버튼설정] 디버그 정보:`, {
                messageId: context.messageId,
                customId: context.customId,
                hasMessage: !!context.channel?.messages?.cache?.get(context.messageId),
                errorName: error.name,
                errorMessage: error.message
            });
            
            throw new Error(`버튼 설정 변경 실패: ${error.message}`);
        }
    }

    /**
     * customId에서 버튼 ID 추출
     */
    extractButtonId(customId) {
        if (!customId) return '';
        
        // automation_[buttonId] 형식에서 buttonId 추출
        const match = customId.match(/automation_(.+)/);
        return match ? match[1] : '';
    }

    /**
     * 지원하는 액션 타입들
     */
    static getSupportedActions() {
        return ['button_setting'];
    }

    /**
     * 액션 검증
     */
    async validate(action, context) {
        await super.validate(action, context);

        const { buttonStyle, buttonLabel, buttonDisabled, buttonEmoji } = action.parameters;

        // 스타일 검증
        if (buttonStyle && !['primary', 'secondary', 'success', 'danger'].includes(buttonStyle)) {
            throw new Error(`지원하지 않는 버튼 스타일: ${buttonStyle}`);
        }

        // 라벨 길이 검증
        if (buttonLabel && buttonLabel.length > 80) {
            throw new Error('버튼 라벨은 80자를 초과할 수 없습니다.');
        }

        // 이모지 형식 검증
        if (buttonEmoji && buttonEmoji.length > 50) {
            throw new Error('버튼 이모지는 50자를 초과할 수 없습니다.');
        }
    }
}

module.exports = { ButtonSettingExecutor };