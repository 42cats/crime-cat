const { ButtonAutomationEngine } = require('./ButtonAutomationEngine');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { executeButtonAutomation } = require('../Commands/api/automation/automationApi');
const MusicPlayerV4 = require('../Commands/utility/v4/MusicPlayerV4');

/**
 * Discord 버튼 자동화 메인 핸들러
 * 버튼 상호작용을 받아 액션들을 실행하는 최상위 핸들러
 */
class ButtonAutomationHandler {
    constructor() {
        this.engine = new ButtonAutomationEngine();
        this.isInitialized = false;
        this.executionHistory = new Map(); // 실행 기록 저장
        this.cooldowns = new Map(); // 쿨다운 관리
    }

    /**
     * 핸들러 초기화
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            await this.engine.initialize();
            this.isInitialized = true;
            console.log('ButtonAutomationHandler 초기화 완료');
        } catch (error) {
            console.error('ButtonAutomationHandler 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 버튼 상호작용 처리
     * @param {Interaction} interaction - Discord 버튼 상호작용
     * @param {Object} buttonConfig - 버튼 설정 (JSON)
     */
    async handleButtonInteraction(interaction, buttonConfig) {
        try {
            // 핸들러 초기화 확인
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log(`버튼 자동화 실행 시작: ${buttonConfig.buttonLabel} (사용자: ${interaction.user.tag})`);

            // 1. 기본 검증
            const validationResult = await this.validateInteraction(interaction, buttonConfig);
            if (!validationResult.valid) {
                await this.sendErrorResponse(interaction, validationResult.reason);
                return;
            }

            // 2. 조건 검증 (역할, 채널, 쿨다운 등)
            const conditionResult = await this.checkConditions(interaction, buttonConfig);
            if (!conditionResult.passed) {
                await this.sendErrorResponse(interaction, conditionResult.reason);
                return;
            }

            // 3. 실행 컨텍스트 구성
            const context = await this.buildExecutionContext(interaction, buttonConfig);

            // 4. 즉시 응답 (Discord 3초 제한 대응)
            await this.sendImmediateResponse(interaction, buttonConfig);

            // 5. 액션 실행
            const executionResult = await this.engine.executeActions(
                buttonConfig.actions || [],
                context
            );

            // 6. 실행 결과 처리
            await this.handleExecutionResult(interaction, buttonConfig, executionResult);

            // 7. 쿨다운 설정
            this.setCooldown(interaction.user.id, interaction.guildId, buttonConfig);

            console.log(`버튼 자동화 실행 완료: ${executionResult.status} (${executionResult.duration}ms)`);

        } catch (error) {
            console.error('버튼 자동화 처리 오류:', error);
            await this.handleError(interaction, error);
        }
    }

    /**
     * 기본 상호작용 검증
     */
    async validateInteraction(interaction, buttonConfig) {
        // 길드 내에서만 실행
        if (!interaction.guild) {
            return {
                valid: false,
                reason: '이 버튼은 서버에서만 사용할 수 있습니다.'
            };
        }

        // 봇 권한 확인
        const botMember = interaction.guild.members.me;
        if (!botMember) {
            return {
                valid: false,
                reason: '봇 정보를 가져올 수 없습니다.'
            };
        }

        // 버튼 설정 유효성 확인
        if (!buttonConfig || !buttonConfig.actions) {
            return {
                valid: false,
                reason: '버튼 설정이 올바르지 않습니다.'
            };
        }

        // 액션 개수 제한 확인
        if (buttonConfig.actions.length === 0) {
            return {
                valid: false,
                reason: '실행할 액션이 없습니다.'
            };
        }

        if (buttonConfig.actions.length > 25) {
            return {
                valid: false,
                reason: '액션은 최대 25개까지 설정할 수 있습니다.'
            };
        }

        return { valid: true };
    }

    /**
     * 실행 조건 검증
     */
    async checkConditions(interaction, buttonConfig) {
        const { conditions } = buttonConfig;
        const { user, member, guild, channel } = interaction;

        // 조건이 없으면 통과
        if (!conditions) {
            return { passed: true };
        }

        try {
            // 1. 필수 역할 확인
            if (conditions.requiredRoles && conditions.requiredRoles.length > 0) {
                const hasRequiredRole = conditions.requiredRoles.some(roleId => 
                    member.roles.cache.has(roleId)
                );
                
                if (!hasRequiredRole) {
                    const roleNames = await this.getRoleNames(guild, conditions.requiredRoles);
                    return {
                        passed: false,
                        reason: `다음 역할 중 하나가 필요합니다: ${roleNames.join(', ')}`
                    };
                }
            }

            // 2. 차단 역할 확인
            if (conditions.deniedRoles && conditions.deniedRoles.length > 0) {
                const hasDeniedRole = conditions.deniedRoles.some(roleId => 
                    member.roles.cache.has(roleId)
                );
                
                if (hasDeniedRole) {
                    return {
                        passed: false,
                        reason: '이 버튼을 사용할 수 없는 역할입니다.'
                    };
                }
            }

            // 3. 채널 제한 확인
            if (conditions.requiredChannel && conditions.requiredChannel !== channel.id) {
                const requiredChannel = await guild.channels.fetch(conditions.requiredChannel);
                return {
                    passed: false,
                    reason: `이 버튼은 ${requiredChannel?.name || '특정 채널'}에서만 사용할 수 있습니다.`
                };
            }

            // 4. 쿨다운 확인
            if (conditions.cooldown && conditions.cooldown > 0) {
                const cooldownKey = `${user.id}_${guild.id}_${buttonConfig.buttonId || 'unknown'}`;
                const lastUsed = this.cooldowns.get(cooldownKey);
                
                if (lastUsed) {
                    const timePassed = (Date.now() - lastUsed) / 1000;
                    const remaining = conditions.cooldown - timePassed;
                    
                    if (remaining > 0) {
                        return {
                            passed: false,
                            reason: `쿨다운 중입니다. ${Math.ceil(remaining)}초 후에 다시 시도해주세요.`
                        };
                    }
                }
            }

            // 5. 사용 제한 확인
            if (conditions.maxUses && conditions.maxUses > 0) {
                const usageKey = `${user.id}_${guild.id}_${buttonConfig.buttonId || 'unknown'}_uses`;
                const currentUses = this.executionHistory.get(usageKey) || 0;
                
                if (currentUses >= conditions.maxUses) {
                    return {
                        passed: false,
                        reason: `이 버튼의 사용 횟수를 초과했습니다. (최대 ${conditions.maxUses}회)`
                    };
                }
            }

            return { passed: true };

        } catch (error) {
            console.error('조건 검증 오류:', error);
            return {
                passed: false,
                reason: '조건 검증 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * 실행 컨텍스트 구성
     */
    async buildExecutionContext(interaction, buttonConfig) {
        const { user, member, guild, channel } = interaction;

        return {
            // Discord 객체들
            user,
            member,
            guild,
            channel,
            interaction,

            // 버튼 정보
            buttonId: buttonConfig.buttonId || 'unknown',
            buttonLabel: buttonConfig.buttonLabel || '버튼',
            buttonConfig,

            // 실행 정보
            executedAt: new Date(),
            executedBy: user.id,
            
            // 길드 정보
            guildId: guild.id,
            channelId: channel.id,

            // 추가 컨텍스트
            timestamp: Date.now(),
            executionId: `${guild.id}_${user.id}_${Date.now()}`
        };
    }

    /**
     * 즉시 응답 전송 (Discord 3초 제한 대응)
     */
    async sendImmediateResponse(interaction, buttonConfig) {
        const { immediateResponse } = buttonConfig;

        try {
            if (immediateResponse && immediateResponse.message) {
                // 설정된 즉시 응답
                await interaction.reply({
                    content: this.processMessageVariables(immediateResponse.message, interaction),
                    ephemeral: immediateResponse.ephemeral !== false
                });
            } else {
                // 기본 즉시 응답
                await interaction.reply({
                    content: '⚙️ 액션을 실행하고 있습니다...',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('즉시 응답 전송 실패:', error);
            // 응답 실패 시에도 액션은 계속 실행
        }
    }

    /**
     * 실행 결과 처리
     */
    async handleExecutionResult(interaction, buttonConfig, executionResult) {
        const { status, successCount, failCount, results, duration } = executionResult;

        try {
            // 1. 완료 메시지 전송
            if (buttonConfig.completionMessage) {
                const completionContent = this.processMessageVariables(
                    buttonConfig.completionMessage,
                    interaction,
                    { 
                        successCount, 
                        failCount, 
                        duration: Math.round(duration),
                        status 
                    }
                );

                await interaction.followUp({
                    content: completionContent,
                    ephemeral: buttonConfig.completionEphemeral !== false
                });
            }

            // 2. 상세 결과 로깅
            console.log(`실행 결과 - 상태: ${status}, 성공: ${successCount}, 실패: ${failCount}, 소요시간: ${duration}ms`);
            
            if (results && results.length > 0) {
                results.forEach((result, index) => {
                    if (!result.success) {
                        console.warn(`액션 ${index + 1} 실패:`, result.error?.message);
                    }
                });
            }

            // 3. 사용 횟수 기록
            this.recordExecution(interaction.user.id, interaction.guildId, buttonConfig);

        } catch (error) {
            console.error('실행 결과 처리 오류:', error);
        }
    }

    /**
     * 오류 응답 전송
     */
    async sendErrorResponse(interaction, reason) {
        try {
            const errorMessage = `❌ ${reason}`;
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: errorMessage,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: errorMessage,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('오류 응답 전송 실패:', error);
        }
    }

    /**
     * 예외 처리
     */
    async handleError(interaction, error) {
        console.error('ButtonAutomationHandler 오류:', error);
        console.error('오류 스택:', error.stack);

        try {
            // 오류 메시지를 사용자에게 표시 (개인 메시지)
            let userErrorMessage = '⚠️ 버튼 처리 중 오류가 발생했습니다.';
            
            // 구체적인 오류 정보 추가 (사용자에게 유용한 정보만)
            if (error.message) {
                if (error.message.includes('권한') || error.message.includes('역할')) {
                    userErrorMessage += '\n' + error.message;
                } else if (error.message.includes('찾을 수 없')) {
                    userErrorMessage += '\n' + error.message;
                } else {
                    userErrorMessage += '\n관리자에게 문의해주세요.';
                }
            }
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: userErrorMessage,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: userErrorMessage,
                    ephemeral: true
                });
            }
        } catch (followUpError) {
            console.error('오류 메시지 전송 실패:', followUpError);
        }
    }

    /**
     * 메시지 변수 치환
     */
    processMessageVariables(message, interaction, additionalVars = {}) {
        if (!message) return '';

        let processed = message
            .replace(/{user}/g, `<@${interaction.user.id}>`)
            .replace(/{username}/g, interaction.user.username)
            .replace(/{guild}/g, interaction.guild?.name || '서버')
            .replace(/{channel}/g, `<#${interaction.channel?.id}>`)
            .replace(/{button}/g, '버튼');

        // 추가 변수 처리
        Object.entries(additionalVars).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            processed = processed.replace(regex, value);
        });

        return processed;
    }

    /**
     * 역할 이름 조회
     */
    async getRoleNames(guild, roleIds) {
        const names = [];
        for (const roleId of roleIds) {
            try {
                const role = await guild.roles.fetch(roleId);
                names.push(role ? role.name : `알 수 없는 역할 (${roleId})`);
            } catch (error) {
                names.push(`알 수 없는 역할 (${roleId})`);
            }
        }
        return names;
    }

    /**
     * 쿨다운 설정
     */
    setCooldown(userId, guildId, buttonConfig) {
        if (buttonConfig.conditions?.cooldown && buttonConfig.conditions.cooldown > 0) {
            const cooldownKey = `${userId}_${guildId}_${buttonConfig.buttonId || 'unknown'}`;
            this.cooldowns.set(cooldownKey, Date.now());

            // 쿨다운 만료 시 자동 삭제
            setTimeout(() => {
                this.cooldowns.delete(cooldownKey);
            }, buttonConfig.conditions.cooldown * 1000);
        }
    }

    /**
     * 실행 기록
     */
    recordExecution(userId, guildId, buttonConfig) {
        if (buttonConfig.conditions?.maxUses && buttonConfig.conditions.maxUses > 0) {
            const usageKey = `${userId}_${guildId}_${buttonConfig.buttonId || 'unknown'}_uses`;
            const currentUses = this.executionHistory.get(usageKey) || 0;
            this.executionHistory.set(usageKey, currentUses + 1);
        }
    }

    /**
     * 실행 기록 정리
     */
    cleanupHistory() {
        // 24시간 이상 된 기록 삭제
        const cutoff = Date.now() - (24 * 60 * 60 * 1000);
        
        for (const [key, timestamp] of this.cooldowns.entries()) {
            if (timestamp < cutoff) {
                this.cooldowns.delete(key);
            }
        }

        console.log('ButtonAutomationHandler 기록 정리 완료');
    }

    /**
     * 상태 조회
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            engineStatus: this.engine.getStatus(),
            activeCooldowns: this.cooldowns.size,
            executionHistorySize: this.executionHistory.size
        };
    }

    /**
     * 백엔드에서 버튼 설정 조회
     * @param {string} buttonId 버튼 ID
     * @param {string} guildId 길드 ID
     * @returns {Promise<Object>} 버튼 설정
     */
    async getButtonConfig(buttonId, guildId) {
        const { getBotButtonData } = require('../Commands/api/automation/automationApi');
        
        try {
            console.log("🔍 [설정 조회] 버튼 설정 조회 시작:", { buttonId, guildId });
            
            // API 모듈을 통해 버튼 데이터 조회
            const buttonData = await getBotButtonData(buttonId);
            console.log("📄 [설정 조회] API에서 받은 버튼 데이터:", buttonData);
            
            // config 필드의 JSON을 파싱
            let parsedConfig;
            try {
                parsedConfig = typeof buttonData.config === 'string' 
                    ? JSON.parse(buttonData.config)
                    : buttonData.config;
            } catch (parseError) {
                console.error("❌ [설정 조회] JSON 파싱 실패:", parseError);
                throw new Error(`버튼 설정 JSON 파싱 실패: ${parseError.message}`);
            }
            
            console.log("🔧 [설정 조회] 파싱된 config:", parsedConfig);
            
            // ButtonAutomationEngine이 기대하는 형태로 변환
            const buttonConfig = {
                id: buttonData.id,
                buttonLabel: buttonData.buttonLabel,
                actions: parsedConfig.actions || [],
                trigger: parsedConfig.trigger || { type: 'everyone', roles: [], users: [] },
                conditions: parsedConfig.conditions || { requiredChannels: [], requiredRoles: [], oncePerUser: false },
                buttonSettings: parsedConfig.buttonSettings || { style: 'primary', disableAfterUse: false },
                options: parsedConfig.options || { oncePerUser: false, logEnabled: true }
            };
            
            console.log("✅ [설정 조회] 버튼 설정 조회 완료:", buttonConfig);
            return buttonConfig;
            
        } catch (error) {
            console.error("❌ [설정 조회] 버튼 설정 조회 실패:", error);
            throw new Error(`버튼 설정 조회 실패: ${error.message}`);
        }
    }

    /**
     * ButtonAutomationEngine으로 액션들 실행
     * @param {Object} buttonConfig 버튼 설정
     * @param {Object} context 실행 컨텍스트
     * @returns {Promise<Object>} 실행 결과
     */
    async executeActionsWithEngine(buttonConfig, context) {
        try {
            console.log("🚀 [엔진 실행] ButtonAutomationEngine으로 액션 실행 시작");
            console.log("🔧 [엔진 실행] 실행할 액션들:", buttonConfig.actions);
            
            const results = [];
            let allSuccessful = true;
            
            for (let i = 0; i < buttonConfig.actions.length; i++) {
                const action = buttonConfig.actions[i];
                console.log(`🎯 [엔진 실행] 액션 ${i + 1}/${buttonConfig.actions.length} 실행 중:`, action.type);
                
                try {
                    // 지연 시간 적용
                    if (action.delay && action.delay > 0) {
                        console.log(`⏱️ [엔진 실행] ${action.delay}ms 대기 중...`);
                        await new Promise(resolve => setTimeout(resolve, action.delay));
                    }
                    
                    // 조건 확인 (간단한 구현)
                    if (action.conditions && action.conditions.length > 0) {
                        const conditionMet = await this.checkConditions(action.conditions, context);
                        if (!conditionMet) {
                            console.log(`❌ [엔진 실행] 액션 ${action.type} 조건 불만족으로 건너뜀`);
                            continue;
                        }
                    }
                    
                    // 액션 실행
                    const executor = this.engine.executors.get(action.type);
                    if (!executor) {
                        console.warn(`⚠️ [엔진 실행] 알 수 없는 액션 타입: ${action.type}`);
                        // 직접 실행 시도
                        const directResult = await this.executeActionDirect(action, context);
                        results.push(directResult);
                    } else {
                        const result = await executor.execute(action, context);
                        results.push(result);
                        console.log(`✅ [엔진 실행] 액션 ${action.type} 실행 완료:`, result);
                    }
                    
                } catch (actionError) {
                    console.error(`❌ [엔진 실행] 액션 ${action.type} 실행 실패:`, actionError);
                    allSuccessful = false;
                    results.push({
                        type: action.type,
                        success: false,
                        error: actionError.message
                    });
                }
            }
            
            const finalResult = {
                success: allSuccessful,
                executedActions: results,
                message: allSuccessful ? 
                    `${results.length}개의 액션이 성공적으로 실행되었습니다.` : 
                    `일부 액션 실행에 실패했습니다.`,
                cooldownRemaining: 0
            };
            
            console.log("🏁 [엔진 실행] 전체 실행 완료:", finalResult);
            return finalResult;
            
        } catch (error) {
            console.error("❌ [엔진 실행] 전체 실행 실패:", error);
            return {
                success: false,
                executedActions: [],
                message: `액션 실행 실패: ${error.message}`,
                cooldownRemaining: 0
            };
        }
    }

    /**
     * 조건 확인 (간단한 구현)
     * @param {Array} conditions 조건 배열
     * @param {Object} context 실행 컨텍스트
     * @returns {Promise<boolean>} 조건 만족 여부
     */
    async checkConditions(conditions, context) {
        // TODO: 실제 조건 확인 로직 구현
        return true; // 임시로 항상 true 반환
    }

    /**
     * 액션 직접 실행 (엔진에 없는 액션들)
     * @param {Object} action 액션 설정
     * @param {Object} context 실행 컨텍스트
     * @returns {Promise<Object>} 실행 결과
     */
    async executeActionDirect(action, context) {
        const { type, parameters, target } = action;
        
        try {
            switch (type) {
                case 'add_role':
                case 'remove_role':
                case 'toggle_role':
                    return await this.executeRoleActionDirect(action, context);
                    
                case 'send_message':
                case 'send_dm':
                    return await this.executeMessageActionDirect(action, context);
                    
                default:
                    throw new Error(`지원하지 않는 액션 타입: ${type}`);
            }
        } catch (error) {
            console.error(`[직접 실행] 액션 ${type} 실행 실패:`, error);
            return {
                type,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 역할 액션 직접 실행
     */
    async executeRoleActionDirect(action, context) {
        const { type, parameters } = action;
        const { member, guild } = context;
        
        // 테스트용 역할 ID (실제로는 parameters.roleId 사용)
        const testRoleId = '1386142434906095666'; // 실제 존재하는 역할 ID로 교체
        
        const role = guild.roles.cache.get(testRoleId);
        if (!role) {
            throw new Error('역할을 찾을 수 없습니다.');
        }
        
        switch (type) {
            case 'add_role':
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                    return { type, success: true, description: `${role.name} 역할을 추가했습니다.` };
                }
                return { type, success: true, description: `이미 ${role.name} 역할을 보유하고 있습니다.` };
                
            case 'remove_role':
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    return { type, success: true, description: `${role.name} 역할을 제거했습니다.` };
                }
                return { type, success: true, description: `${role.name} 역할을 보유하고 있지 않습니다.` };
                
            case 'toggle_role':
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    return { type, success: true, description: `${role.name} 역할을 제거했습니다.` };
                } else {
                    await member.roles.add(role);
                    return { type, success: true, description: `${role.name} 역할을 추가했습니다.` };
                }
                
            default:
                throw new Error(`알 수 없는 역할 액션: ${type}`);
        }
    }

    /**
     * 메시지 액션 직접 실행
     */
    async executeMessageActionDirect(action, context) {
        const { type, parameters } = action;
        const { channel, user, guild } = context;
        
        switch (type) {
            case 'send_message':
                const targetChannel = parameters.channelId ? 
                    guild.channels.cache.get(parameters.channelId) : channel;
                    
                if (!targetChannel || !targetChannel.isTextBased()) {
                    throw new Error('대상 채널을 찾을 수 없습니다.');
                }
                
                const message = this.replaceVariables(parameters.message, context);
                await targetChannel.send(message);
                return { type, success: true, description: '메시지를 전송했습니다.' };
                
            case 'send_dm':
                const dmMessage = this.replaceVariables(parameters.message, context);
                await user.send(dmMessage);
                return { type, success: true, description: 'DM을 전송했습니다.' };
                
            default:
                throw new Error(`알 수 없는 메시지 액션: ${type}`);
        }
    }

    /**
     * 변수 치환 처리
     */
    replaceVariables(text, context) {
        const { user, guild } = context;
        return text
            .replace(/{user}/g, user.toString())
            .replace(/{username}/g, user.username)
            .replace(/{guild}/g, guild.name)
            .replace(/{date}/g, new Date().toISOString().split('T')[0])
            .replace(/{time}/g, new Date().toTimeString().split(' ')[0])
            .replace(/{datetime}/g, new Date().toLocaleString('ko-KR'));
    }
}

/**
 * 버튼 자동화 클릭 이벤트 처리
 * @param {ButtonInteraction} interaction Discord 버튼 상호작용
 */
async function handleButtonAutomation(interaction) {
    // 버튼 ID에서 자동화 버튼 ID 추출
    const buttonId = interaction.customId.replace('automation_', '');
    
    if (!buttonId) {
        return await interaction.reply({
            content: '❌ 유효하지 않은 버튼입니다.',
            ephemeral: true
        });
    }

    try {
        // 즉시 응답하여 3초 제한 회피
        await interaction.deferReply({ ephemeral: true });

        // 실행 컨텍스트 준비
        const context = {
            userId: interaction.user.id,
            guildId: interaction.guild?.id,
            channelId: interaction.channel?.id,
            messageId: interaction.message?.id,
            customId: interaction.customId, // button_setting 액션을 위해 추가
            user: interaction.user,
            member: interaction.member,
            channel: interaction.channel,
            guild: interaction.guild
        };

        // 버튼 자동화 실행
        console.log("🎯 [핸들러] 버튼 자동화 실행 시작:", { buttonId, userId: context.userId, guildId: context.guildId });
        
        // ButtonAutomationHandler 인스턴스 생성
        const handler = new ButtonAutomationHandler();
        await handler.initialize();
        
        // 1. 백엔드에서 버튼 설정만 조회
        const buttonConfig = await handler.getButtonConfig(buttonId, context.guildId);
        console.log("🔧 [핸들러] 버튼 설정 조회:", buttonConfig);
        
        // 2. ButtonAutomationEngine으로 액션 실행
        const result = await handler.executeActionsWithEngine(buttonConfig, context);
        console.log("🎯 [핸들러] 버튼 자동화 실행 결과:", result);

        if (result.success) {
            console.log("✅ [핸들러] 버튼 자동화 성공, 추가 액션 처리 중...");
            // 음악 액션이 포함된 경우 직접 처리
            if (result.executedActions && result.executedActions.length > 0) {
                const processedResults = [];
                
                for (const action of result.executedActions) {
                    try {
                        let actionResult;
                        
                        // 음악 액션 확인 및 처리
                        if (['play_music', 'stop_music', 'pause_music'].includes(action.type)) {
                            console.log(`[자동화] 음악 액션 실행: ${action.type}`);
                            actionResult = await executeMusicAction(action, context);
                        } else {
                            // 기존 액션은 백엔드에서 처리된 결과 사용
                            actionResult = action;
                        }
                        
                        processedResults.push(actionResult);
                    } catch (actionError) {
                        console.error(`[자동화] 액션 실행 실패 (${action.type}):`, actionError);
                        processedResults.push({
                            success: false,
                            description: `${action.type} 실행 실패: ${actionError.message}`,
                            type: action.type
                        });
                    }
                }
                
                // 결과에 처리된 액션들 반영
                result.executedActions = processedResults;
            }
            
            await handleSuccessResponse(interaction, result);
        } else {
            await handleErrorResponse(interaction, result);
        }

    } catch (error) {
        console.error('버튼 자동화 처리 오류:', error);
        await handleCriticalError(interaction, error);
    }
}

/**
 * 자동화 성공 응답 처리
 * @param {ButtonInteraction} interaction 
 * @param {Object} result 실행 결과
 */
async function handleSuccessResponse(interaction, result) {
    const embed = new EmbedBuilder()
        .setColor(0x27ae60)
        .setTitle('✅ 자동화 실행 완료')
        .setDescription(result.message || '요청이 성공적으로 처리되었습니다.')
        .setTimestamp();

    // 실행된 액션들 표시
    if (result.executedActions && result.executedActions.length > 0) {
        const actionText = result.executedActions
            .slice(0, 5) // 최대 5개까지만 표시
            .map(action => `• ${action.description || action.type}`)
            .join('\n');

        embed.addFields({
            name: '실행된 액션',
            value: actionText + (result.executedActions.length > 5 ? `\n... 외 ${result.executedActions.length - 5}개` : ''),
            inline: false
        });
    }

    // 쿨다운 정보 표시
    if (result.cooldownRemaining && result.cooldownRemaining > 0) {
        embed.addFields({
            name: '다음 사용 가능 시간',
            value: `${Math.ceil(result.cooldownRemaining / 1000)}초 후`,
            inline: true
        });
    }

    try {
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('성공 응답 전송 오류:', error);
        await interaction.editReply({
            content: '✅ 자동화가 실행되었지만 응답 전송 중 오류가 발생했습니다.'
        });
    }
}

/**
 * 자동화 실패 응답 처리
 * @param {ButtonInteraction} interaction 
 * @param {Object} result 실행 결과
 */
async function handleErrorResponse(interaction, result) {
    // 콘솔에 상세한 오류 정보 출력
    console.error('❌ [오류응답] 자동화 실행 실패:', {
        message: result.message,
        failedAction: result.failedAction,
        data: result.data,
        stack: result.error?.stack
    });

    // 사용자에게 표시할 오류 메시지 (개인 메시지)
    let userMessage = '❌ 자동화 실행 실패\n';
    
    if (result.message) {
        // 사용자에게 유용한 오류 메시지만 표시
        if (result.message.includes('권한') || result.message.includes('역할')) {
            userMessage += result.message;
        } else if (result.message.includes('찾을 수 없')) {
            userMessage += result.message;
        } else if (result.message.includes('쿨다운') || result.message.includes('사용할 수 없습니다')) {
            userMessage += result.message;
        } else {
            userMessage += '요청 처리 중 오류가 발생했습니다. 관리자에게 문의해주세요.';
        }
    } else {
        userMessage += '요청 처리 중 오류가 발생했습니다.';
    }

    // 실패한 액션 정보 추가
    if (result.failedAction) {
        userMessage += `\n실패한 액션: ${result.failedAction.description || result.failedAction.type}`;
    }

    // 쿨다운 정보 추가
    if (result.cooldownRemaining && result.cooldownRemaining > 0) {
        userMessage += `\n다음 사용 가능: ${Math.ceil(result.cooldownRemaining / 1000)}초 후`;
    }

    try {
        // ephemeral 메시지로 전송 (개인에게만 표시)
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: userMessage,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: userMessage,
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('❌ [오류응답] 실패 응답 전송 오류:', error);
        try {
            await interaction.editReply({
                content: '❌ 자동화 실행이 실패했습니다.'
            });
        } catch (editError) {
            console.error('❌ [오류응답] editReply도 실패:', editError);
        }
    }
}

/**
 * 심각한 오류 응답 처리
 * @param {ButtonInteraction} interaction 
 * @param {Error} error 오류 객체
 */
async function handleCriticalError(interaction, error) {
    // 콘솔에 상세한 오류 정보 출력
    console.error('🚨 [심각한오류] 시스템 오류:', {
        message: error.message,
        stack: error.stack,
        interaction: {
            customId: interaction.customId,
            user: interaction.user.tag,
            guild: interaction.guild?.name
        }
    });

    let errorMessage = '❌ 시스템 오류가 발생했습니다.';
    
    // 사용자에게 유용한 오류 메시지 제공
    if (error.message.includes('권한') || error.message.includes('역할')) {
        errorMessage = '❌ ' + error.message;
    } else if (error.message.includes('쿨다운')) {
        errorMessage = '❌ 아직 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('조건')) {
        errorMessage = '❌ 실행 조건을 만족하지 않습니다.';
    } else if (error.message.includes('찾을 수 없')) {
        errorMessage = '❌ ' + error.message;
    } else {
        errorMessage = '❌ 시스템 오류가 발생했습니다. 관리자에게 문의해주세요.';
    }

    try {
        // ephemeral 메시지로 전송 (개인에게만 표시)
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: errorMessage,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
        }
    } catch (followupError) {
        console.error('🚨 [심각한오류] 오류 응답 전송 실패:', followupError);
        // 최후의 수단으로 간단한 텍스트 응답 시도
        try {
            await interaction.editReply({ content: errorMessage });
        } catch (finalError) {
            console.error('최종 응답 전송 실패:', finalError);
        }
    }
}

/**
 * 음악 액션 실행기
 */
async function executeMusicAction(action, context) {
    const { parameters } = action;
    const { guild, member, user } = context;
    
    if (!guild || !member) {
        throw new Error('길드 또는 멤버 정보가 없습니다.');
    }
    
    switch (action.type) {
        case 'play_music':
            return await handlePlayMusic(parameters, guild, member, user);
        case 'stop_music':
            return await handleStopMusic(guild);
        case 'pause_music':
            return await handlePauseMusic(guild);
        default:
            throw new Error(`알 수 없는 음악 액션: ${action.type}`);
    }
}

/**
 * 음악 재생 처리
 */
async function handlePlayMusic(params, guild, member, user) {
    try {
        // 1. 음성 채널 확인
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            throw new Error('음성 채널에 입장해주세요.');
        }
        
        // 2. 기존 플레이어 확인 또는 새로 생성 (귀여워 명령어 로직 재사용)
        let musicData = guild.client.serverMusicData?.get(guild.id);
        
        if (!musicData) {
            console.log(`🎵 새 음악 플레이어 생성 (자동화): ${guild.name} (${guild.id})`);
            
            // client.serverMusicData Map 초기화
            if (!guild.client.serverMusicData) {
                guild.client.serverMusicData = new Map();
            }
            
            // 새 플레이어 생성 (귀여워.js의 musicLogic과 동일)
            musicData = new MusicPlayerV4(guild.id, guild.client, user);
            guild.client.serverMusicData.set(guild.id, musicData);
            
            // 초기 플레이리스트 로드
            const loaded = await musicData.queue.loadFromSource('youtube');
            if (!loaded) {
                console.warn(`[자동화] YouTube 플레이리스트 로드 실패, 빈 큐로 계속 진행`);
            }
            
            console.log(`[자동화] 새 플레이어 생성 완료: ${guild.id}`);
        } else {
            console.log(`[자동화] 기존 플레이어 사용: ${guild.id}`);
            
            // 사용자 정보 업데이트
            if (musicData.user !== user) {
                musicData.user = user;
            }
        }
        
        // 3. 기존 재생 중인 음악 처리
        if (musicData.state.isPlaying) {
            switch (params.stopBehavior) {
                case 'stop_current':
                    console.log('🛑 기존 음악 정지 후 새 음악 재생');
                    await musicData.audio.stop();
                    break;
                case 'skip_if_playing':
                    return { 
                        success: false, 
                        description: '다른 음악이 재생 중입니다. 재생을 건너뜁니다.' 
                    };
                case 'queue_after':
                    throw new Error('대기열 기능은 아직 지원되지 않습니다.');
                default:
                    await musicData.audio.stop();
            }
        }
        
        // 4. 음성 채널 연결 (기존 connectToVoice 메서드 사용)
        if (!musicData.audio.connection || musicData.audio.connection.state.status !== 'ready') {
            console.log(`🔗 음성 채널 연결: ${voiceChannel.name}`);
            try {
                await musicData.audio.connectToVoice(member);
                console.log(`[자동화] 음성 채널 연결 성공: ${voiceChannel.name}`);
            } catch (error) {
                console.error(`[자동화] 음성 채널 연결 실패:`, error);
                throw new Error(`음성 채널 연결 실패: ${error.message}`);
            }
        }
        
        // 5. 음악 소스 로드 (필요시)
        if (musicData.queue.source !== params.source || musicData.queue.length === 0) {
            console.log(`📂 음악 소스 로드: ${params.source}`);
            const loadSuccess = await musicData.queue.loadFromSource(params.source, user.id);
            
            if (!loadSuccess || musicData.queue.length === 0) {
                throw new Error(`${params.source} 음악 목록을 불러오지 못했습니다.`);
            }
        }
        
        // 6. 특정 트랙으로 이동
        const trackIndex = findTrackIndex(musicData.queue.tracks, params.trackId, params.source);
        if (trackIndex === -1) {
            throw new Error('선택한 음악을 찾을 수 없습니다.');
        }
        
        musicData.state.currentIndex = trackIndex;
        musicData.state.isDirectSelection = true;
        
        // 7. 음악 재생 시작
        console.log(`▶️ 음악 재생 시작: ${musicData.queue.getCurrentTrack()?.title}`);
        await musicData.audio.play();
        
        // 8. 재생 시간 제한 (옵션)
        if (params.duration && params.duration > 0) {
            setTimeout(() => {
                if (musicData.state.isPlaying) {
                    console.log(`⏰ 재생 시간 만료로 음악 정지: ${params.duration}초`);
                    musicData.audio.stop();
                }
            }, params.duration * 1000);
        }
        
        // 9. 볼륨 설정 (옵션)
        if (params.volume && params.volume !== musicData.state.volume) {
            musicData.audio.setVolume(params.volume / 100);
        }
        
        const currentTrack = musicData.queue.getCurrentTrack();
        return {
            success: true,
            description: `음악이 재생되었습니다: ${currentTrack?.title}`,
            details: {
                track: currentTrack?.title,
                source: params.source,
                duration: params.duration ? `${params.duration}초간` : '끝까지',
                channel: voiceChannel.name
            }
        };
        
    } catch (error) {
        console.error('[자동화] 음악 재생 오류:', error);
        throw new Error(`음악 재생 실패: ${error.message}`);
    }
}

/**
 * 음악 정지 처리
 */
async function handleStopMusic(guild) {
    const musicData = guild.client.serverMusicData?.get(guild.id);
    
    if (!musicData || !musicData.state.isPlaying) {
        return {
            success: false,
            description: '재생 중인 음악이 없습니다.'
        };
    }
    
    await musicData.audio.stop();
    
    return {
        success: true,
        description: '음악이 정지되었습니다.'
    };
}

/**
 * 음악 일시정지 처리
 */
async function handlePauseMusic(guild) {
    const musicData = guild.client.serverMusicData?.get(guild.id);
    
    if (!musicData || !musicData.state.isPlaying) {
        return {
            success: false,
            description: '재생 중인 음악이 없습니다.'
        };
    }
    
    if (musicData.state.isPaused) {
        await musicData.audio.resume();
        return {
            success: true,
            description: '음악 재생을 재개했습니다.'
        };
    } else {
        await musicData.audio.pause();
        return {
            success: true,
            description: '음악을 일시정지했습니다.'
        };
    }
}

/**
 * 트랙 인덱스 찾기 (QueueManagerV4 로직 참조)
 */
function findTrackIndex(tracks, trackId, source) {
    if (source === 'youtube') {
        // YouTube: trackId는 "yt_인덱스" 형태 또는 직접 인덱스
        if (trackId.startsWith('yt_')) {
            const index = parseInt(trackId.replace('yt_', ''));
            return (index >= 0 && index < tracks.length) ? index : -1;
        } else {
            // 직접 인덱스 번호인 경우
            const index = parseInt(trackId);
            return (index >= 0 && index < tracks.length) ? index : -1;
        }
    } else if (source === 'local') {
        // 로컬: trackId는 "local_해시코드" 형태 또는 파일명
        return tracks.findIndex(track => 
            track.id === trackId || 
            track.title === trackId ||
            track.filename === trackId
        );
    }
    return -1;
}

/**
 * Discord 액션 실행기
 * 백엔드에서 반환된 액션 정보를 바탕으로 실제 Discord API 호출
 */
class DiscordActionExecutor {
    constructor(interaction) {
        this.interaction = interaction;
        this.guild = interaction.guild;
        this.channel = interaction.channel;
        this.member = interaction.member;
        this.user = interaction.user;
    }

    /**
     * 역할 관련 액션 실행
     */
    async executeRoleAction(action) {
        const { type, parameters, target } = action;
        const targetMember = target === 'executor' ? this.member : await this.guild.members.fetch(target);
        
        if (!targetMember) {
            throw new Error('대상 사용자를 찾을 수 없습니다.');
        }

        const role = await this.guild.roles.fetch(parameters.roleId);
        if (!role) {
            throw new Error('역할을 찾을 수 없습니다.');
        }

        // 봇 권한 확인
        if (!this.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            throw new Error('역할 관리 권한이 없습니다.');
        }

        switch (type) {
            case 'add_role':
                if (!targetMember.roles.cache.has(role.id)) {
                    await targetMember.roles.add(role);
                    return { success: true, description: `${role.name} 역할을 추가했습니다.` };
                }
                return { success: true, description: `이미 ${role.name} 역할을 보유하고 있습니다.` };

            case 'remove_role':
                if (targetMember.roles.cache.has(role.id)) {
                    await targetMember.roles.remove(role);
                    return { success: true, description: `${role.name} 역할을 제거했습니다.` };
                }
                return { success: true, description: `${role.name} 역할을 보유하고 있지 않습니다.` };

            case 'toggle_role':
                if (targetMember.roles.cache.has(role.id)) {
                    await targetMember.roles.remove(role);
                    return { success: true, description: `${role.name} 역할을 제거했습니다.` };
                } else {
                    await targetMember.roles.add(role);
                    return { success: true, description: `${role.name} 역할을 추가했습니다.` };
                }

            default:
                throw new Error(`알 수 없는 역할 액션: ${type}`);
        }
    }

    /**
     * 메시지 관련 액션 실행
     */
    async executeMessageAction(action) {
        const { type, parameters } = action;

        switch (type) {
            case 'send_message':
                const targetChannel = await this.guild.channels.fetch(parameters.channelId);
                if (!targetChannel || !targetChannel.isTextBased()) {
                    throw new Error('대상 채널을 찾을 수 없습니다.');
                }

                const message = this.replaceVariables(parameters.message);
                await targetChannel.send(message);
                return { success: true, description: `메시지를 전송했습니다.` };

            case 'send_dm':
                const dmMessage = this.replaceVariables(parameters.message);
                await this.user.send(dmMessage);
                return { success: true, description: `DM을 전송했습니다.` };

            default:
                throw new Error(`알 수 없는 메시지 액션: ${type}`);
        }
    }

    /**
     * 변수 치환 처리
     */
    replaceVariables(text) {
        return text
            .replace(/{user}/g, this.user.toString())
            .replace(/{username}/g, this.user.username)
            .replace(/{guild}/g, this.guild.name)
            .replace(/{date}/g, new Date().toISOString().split('T')[0])
            .replace(/{time}/g, new Date().toTimeString().split(' ')[0])
            .replace(/{datetime}/g, new Date().toLocaleString('ko-KR'));
    }
}

// 기존 함수들과 새로운 클래스를 함께 export
module.exports = {
    ButtonAutomationHandler,
    handleButtonAutomation,
    executeMusicAction,
    DiscordActionExecutor
};