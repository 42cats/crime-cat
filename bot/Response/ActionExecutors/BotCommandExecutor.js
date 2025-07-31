const { BaseActionExecutor } = require('./BaseActionExecutor');

/**
 * 봇 커맨드 실행 액션 실행기
 * 기존에 메모리에 로드된 Discord 커맨드들을 버튼을 통해 실행
 */
class BotCommandExecutor extends BaseActionExecutor {
    constructor() {
        super('execute_bot_command');
        this.supportedTargets = ['executor'];
        this.retryable = true; // 일부 상황에서 재시도 가능
        this.requiredPermissions = []; // 커맨드별로 동적 설정
    }

    async performAction(action, context) {
        const { commandName, parameters = {}, delay = 0, silent = false, channelId } = action.parameters;
        
        console.log(`🤖 [BotCommand] 실행 시작: ${commandName}`, parameters);
        
        // 지연 시간이 설정된 경우 대기
        if (delay > 0) {
            console.log(`⏱️ [BotCommand] ${delay}초 지연 실행 대기 중...`);
            await this.sleep(delay * 1000);
            console.log(`✅ [BotCommand] 지연 완료, 커맨드 실행 시작`);
        }
        
        try {
            // 1. 클라이언트에서 이미 로드된 커맨드 가져오기
            const command = this.getLoadedCommand(context.interaction.client, commandName);
            if (!command || !command.execute) {
                throw new Error(`커맨드를 찾을 수 없습니다: ${commandName}`);
            }

            // 2. 권한 검증
            if (command.permissionLevel !== undefined && command.permissionLevel > -1) {
                const hasPermission = await this.checkCommandPermissions(context, command.permissionLevel);
                if (!hasPermission) {
                    throw new Error(`커맨드 실행 권한이 없습니다: ${commandName}`);
                }
            }

            // 3. 가상 인터랙션 생성 (채널 지정 지원)
            const virtualInteraction = this.createVirtualInteraction(
                context, commandName, parameters, channelId
            );

            // 4. 커맨드 실행 (타임아웃 제거)
            const result = await command.execute(virtualInteraction);

            console.log(`✅ [BotCommand] 실행 완료: ${commandName}`);
            
            return this.formatResult(true, {
                commandName,
                parameters,
                executedAt: new Date().toISOString(),
                responses: virtualInteraction.getResponses ? virtualInteraction.getResponses() : []
            }, `커맨드 "${commandName}"이 성공적으로 실행되었습니다.`);

        } catch (error) {
            console.error(`❌ [BotCommand] 실행 실패: ${commandName}`, error);
            
            if (silent) {
                // 조용히 실행 모드: 실패해도 오류를 표시하지 않음
                return this.formatResult(true, {
                    commandName,
                    silentMode: true,
                    error: error.message
                }, `커맨드가 조용히 실행되었습니다.`);
            }
            
            throw new Error(`커맨드 실행 실패: ${error.message}`);
        }
    }

    /**
     * 이미 메모리에 로드된 커맨드 가져오기 (최적화)
     * @param {Client} client Discord 클라이언트
     * @param {string} commandName 커맨드 이름
     */
    getLoadedCommand(client, commandName) {
        // 1. 슬래시 커맨드에서 찾기
        let command = client.slashCommands?.get(commandName);
        if (command) {
            console.log(`📂 [BotCommand] 슬래시 커맨드에서 발견: ${commandName}`);
            return command;
        }

        // 2. 프리픽스 커맨드에서 찾기
        command = client.prefixCommands?.get(commandName);
        if (command) {
            console.log(`📂 [BotCommand] 프리픽스 커맨드에서 발견: ${commandName}`);
            return command;
        }

        // 3. 별명에서 찾기
        const aliasName = client.aliasesMap?.get(commandName);
        if (aliasName) {
            command = client.slashCommands?.get(aliasName) || client.prefixCommands?.get(aliasName);
            if (command) {
                console.log(`📂 [BotCommand] 별명으로 발견: ${commandName} → ${aliasName}`);
                return command;
            }
        }

        console.log(`❌ [BotCommand] 커맨드를 찾을 수 없음: ${commandName}`);
        return null;
    }

    /**
     * 가상 Discord 인터랙션 생성
     */
    createVirtualInteraction(context, commandName, parameters, targetChannelId) {
        const { interaction, user, member, guild, channel } = context;
        
        // 지정된 채널이 있으면 해당 채널 사용, 없으면 기본 채널 사용
        let executionChannel = channel;
        if (targetChannelId) {
            const specifiedChannel = guild.channels.cache.get(targetChannelId);
            if (specifiedChannel) {
                executionChannel = specifiedChannel;
                console.log(`📍 [BotCommand] 채널 지정됨: ${specifiedChannel.name} (${targetChannelId})`);
            } else {
                console.warn(`⚠️ [BotCommand] 지정된 채널을 찾을 수 없음: ${targetChannelId}. 기본 채널 사용.`);
            }
        } else {
            console.log(`📍 [BotCommand] 기본 채널에서 실행: ${channel.name} (${channel.id})`);
        }
        
        // 응답 추적을 위한 상태
        let hasReplied = false;
        let hasDeferred = false;
        const responses = [];
        
        const virtualInteraction = {
            // 기본 Discord 객체들
            user,
            member,
            guild,
            channel: executionChannel, // 지정된 채널 또는 기본 채널
            client: interaction.client,
            
            // 인터랙션 메타데이터
            commandName,
            id: `virtual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            applicationId: interaction.applicationId,
            token: interaction.token,
            version: interaction.version,
            locale: interaction.locale || 'ko',
            guildLocale: interaction.guildLocale || 'ko',
            
            // 상태 추적
            get replied() { return hasReplied; },
            get deferred() { return hasDeferred; },
            
            // 커맨드 옵션 처리 (핵심 기능)
            options: {
                getString: (name, required = false) => {
                    const value = parameters[name];
                    if (required && (value === undefined || value === null || value === '')) {
                        throw new Error(`필수 파라미터가 없습니다: ${name}`);
                    }
                    return value ? String(value) : null;
                },
                
                getNumber: (name, required = false) => {
                    const value = parameters[name];
                    if (required && (value === undefined || value === null)) {
                        throw new Error(`필수 파라미터가 없습니다: ${name}`);
                    }
                    const num = value !== undefined ? parseFloat(value) : null;
                    if (required && isNaN(num)) {
                        throw new Error(`숫자 형식이 아닙니다: ${name} = ${value}`);
                    }
                    return isNaN(num) ? null : num;
                },
                
                getInteger: (name, required = false) => {
                    const value = parameters[name];
                    if (required && (value === undefined || value === null)) {
                        throw new Error(`필수 파라미터가 없습니다: ${name}`);
                    }
                    const num = value !== undefined ? parseInt(value) : null;
                    if (required && isNaN(num)) {
                        throw new Error(`정수 형식이 아닙니다: ${name} = ${value}`);
                    }
                    return isNaN(num) ? null : num;
                },
                
                getBoolean: (name, required = false) => {
                    const value = parameters[name];
                    if (required && (value === undefined || value === null)) {
                        throw new Error(`필수 파라미터가 없습니다: ${name}`);
                    }
                    if (value === undefined || value === null) return null;
                    
                    // 다양한 boolean 값 처리
                    if (typeof value === 'boolean') return value;
                    if (typeof value === 'string') {
                        const lower = value.toLowerCase();
                        if (['true', '1', 'yes', 'on', '참', '예'].includes(lower)) return true;
                        if (['false', '0', 'no', 'off', '거짓', '아니오'].includes(lower)) return false;
                    }
                    if (typeof value === 'number') return value !== 0;
                    
                    return Boolean(value);
                },
                
                // Discord 객체 관련 옵션들
                getUser: (name, required = false) => {
                    const userId = parameters[name];
                    if (required && !userId) {
                        throw new Error(`필수 파라미터가 없습니다: ${name}`);
                    }
                    return userId ? guild.members.cache.get(userId)?.user : null;
                },
                
                getMember: (name, required = false) => {
                    const userId = parameters[name];
                    if (required && !userId) {
                        throw new Error(`필수 파라미터가 없습니다: ${name}`);
                    }
                    return userId ? guild.members.cache.get(userId) : null;
                },
                
                getChannel: (name, required = false) => {
                    const channelId = parameters[name];
                    if (required && !channelId) {
                        throw new Error(`필수 파라미터가 없습니다: ${name}`);
                    }
                    return channelId ? guild.channels.cache.get(channelId) : null;
                },
                
                getRole: (name, required = false) => {
                    const roleId = parameters[name];
                    if (required && !roleId) {
                        throw new Error(`필수 파라미터가 없습니다: ${name}`);
                    }
                    return roleId ? guild.roles.cache.get(roleId) : null;
                }
            },
            
            // 응답 메서드들 (실제 Discord 메시지 전송)
            reply: async (options) => {
                if (hasReplied) throw new Error('이미 응답했습니다.');
                hasReplied = true;
                
                const messageContent = typeof options === 'string' ? options : options.content;
                const messageOptions = {
                    content: messageContent,
                    embeds: options.embeds || [],
                    components: options.components || [],
                };
                
                try {
                    // 실제 Discord 채널에 메시지 전송
                    console.log(`📤 [VirtualInteraction] Reply 전송 시도:`, {
                        channelName: executionChannel.name,
                        channelId: executionChannel.id,
                        content: messageContent?.substring(0, 100) + (messageContent?.length > 100 ? '...' : ''),
                        hasEmbeds: (options.embeds || []).length > 0,
                        hasComponents: (options.components || []).length > 0,
                        componentsCount: (options.components || []).length
                    });
                    
                    const sentMessage = await executionChannel.send(messageOptions);
                    
                    const response = {
                        type: 'reply',
                        content: messageContent,
                        embeds: options.embeds || [],
                        components: options.components || [],
                        ephemeral: options.ephemeral || false,
                        timestamp: new Date().toISOString(),
                        messageId: sentMessage.id
                    };
                    responses.push(response);
                    
                    console.log(`✅ [VirtualInteraction] Reply 전송 완료:`, {
                        channelName: executionChannel.name,
                        channelId: executionChannel.id,
                        messageId: sentMessage.id,
                        content: messageContent?.substring(0, 100) + (messageContent?.length > 100 ? '...' : ''),
                        componentsInMessage: sentMessage.components?.length || 0
                    });
                    
                    return sentMessage;
                } catch (error) {
                    console.error(`❌ [VirtualInteraction] Reply 전송 실패:`, error);
                    throw error;
                }
            },
            
            editReply: async (options) => {
                if (!hasReplied && !hasDeferred) throw new Error('편집할 응답이 없습니다.');
                
                const messageContent = typeof options === 'string' ? options : options.content;
                const messageOptions = {
                    content: messageContent,
                    embeds: options.embeds || [],
                    components: options.components || [],
                };
                
                try {
                    // 마지막 전송된 메시지 찾기
                    const lastResponse = responses.find(r => r.messageId);
                    if (!lastResponse || !lastResponse.messageId) {
                        console.warn(`⚠️ [VirtualInteraction] 편집할 메시지를 찾을 수 없음, 새 메시지 전송`);
                        // 편집할 메시지가 없으면 새 메시지 전송
                        const sentMessage = await executionChannel.send(messageOptions);
                        
                        const response = {
                            type: 'editReply',
                            content: messageContent,
                            embeds: options.embeds || [],
                            components: options.components || [],
                            timestamp: new Date().toISOString(),
                            messageId: sentMessage.id
                        };
                        responses.push(response);
                        
                        console.log(`📝 [VirtualInteraction] EditReply (새 메시지) 전송 완료:`, {
                            channelName: executionChannel.name,
                            messageId: sentMessage.id,
                            content: messageContent
                        });
                        
                        return sentMessage;
                    }
                    
                    // 기존 메시지 편집
                    const message = await executionChannel.messages.fetch(lastResponse.messageId);
                    const editedMessage = await message.edit(messageOptions);
                    
                    const response = {
                        type: 'editReply',
                        content: messageContent,
                        embeds: options.embeds || [],
                        components: options.components || [],
                        timestamp: new Date().toISOString(),
                        messageId: editedMessage.id
                    };
                    responses.push(response);
                    
                    console.log(`📝 [VirtualInteraction] EditReply 편집 완료:`, {
                        channelName: executionChannel.name,
                        messageId: editedMessage.id,
                        content: messageContent
                    });
                    
                    return editedMessage;
                } catch (error) {
                    console.error(`❌ [VirtualInteraction] EditReply 실패:`, error);
                    throw error;
                }
            },
            
            followUp: async (options) => {
                if (!hasReplied && !hasDeferred) throw new Error('첫 응답이 필요합니다.');
                
                const messageContent = typeof options === 'string' ? options : options.content;
                const messageOptions = {
                    content: messageContent,
                    embeds: options.embeds || [],
                    components: options.components || [],
                };
                
                try {
                    // 새 메시지로 followUp 전송
                    const sentMessage = await executionChannel.send(messageOptions);
                    
                    const response = {
                        type: 'followUp',
                        content: messageContent,
                        embeds: options.embeds || [],
                        components: options.components || [],
                        ephemeral: options.ephemeral || false,
                        timestamp: new Date().toISOString(),
                        messageId: sentMessage.id
                    };
                    responses.push(response);
                    
                    console.log(`📨 [VirtualInteraction] FollowUp 전송 완료:`, {
                        channelName: executionChannel.name,
                        messageId: sentMessage.id,
                        content: messageContent
                    });
                    
                    return sentMessage;
                } catch (error) {
                    console.error(`❌ [VirtualInteraction] FollowUp 전송 실패:`, error);
                    throw error;
                }
            },
            
            deferReply: async (options = {}) => {
                if (hasReplied) throw new Error('이미 응답했습니다.');
                hasDeferred = true;
                
                console.log(`⏳ [VirtualInteraction] DeferReply:`, options);
                return;
            },
            
            // 타이머 등 일부 커맨드에서 필요한 fetchReply 메서드 추가
            fetchReply: async () => {
                if (!hasReplied && !hasDeferred) {
                    throw new Error('아직 응답하지 않았습니다.');
                }
                
                try {
                    // 가장 최근 응답에서 실제 메시지 ID 찾기
                    const lastResponse = responses.find(r => r.messageId);
                    if (!lastResponse || !lastResponse.messageId) {
                        console.warn(`⚠️ [VirtualInteraction] FetchReply: 실제 메시지를 찾을 수 없음`);
                        
                        // 가상 메시지 객체 반환 (후방 호환성)
                        const virtualResponse = responses[responses.length - 1];
                        return {
                            id: virtualResponse?.id || `msg_${Date.now()}`,
                            content: virtualResponse?.content || '',
                            embeds: virtualResponse?.embeds || [],
                            author: user,
                            channel: executionChannel,
                            guild,
                            createdTimestamp: Date.now(),
                            editedTimestamp: null,
                            edit: async (options) => {
                                return virtualInteraction.editReply(options);
                            }
                        };
                    }
                    
                    // 실제 Discord 메시지 fetch
                    const actualMessage = await executionChannel.messages.fetch(lastResponse.messageId);
                    
                    console.log(`🔍 [VirtualInteraction] FetchReply 완료:`, {
                        channelName: executionChannel.name,
                        messageId: actualMessage.id,
                        content: actualMessage.content.substring(0, 100) + (actualMessage.content.length > 100 ? '...' : '')
                    });
                    
                    return actualMessage;
                } catch (error) {
                    console.error(`❌ [VirtualInteraction] FetchReply 실패:`, error);
                    
                    // 에러 시 가상 메시지 객체 반환 (후방 호환성)
                    const lastResponse = responses[responses.length - 1];
                    return {
                        id: lastResponse?.id || `msg_${Date.now()}`,
                        content: lastResponse?.content || '',
                        embeds: lastResponse?.embeds || [],
                        author: user,
                        channel: executionChannel,
                        guild,
                        createdTimestamp: Date.now(),
                        editedTimestamp: null,
                        edit: async (options) => {
                            return virtualInteraction.editReply(options);
                        }
                    };
                }
            },
            
            // 응답 추적용 (디버깅)
            getResponses: () => responses,
            getResponseCount: () => responses.length
        };

        return virtualInteraction;
    }

    /**
     * 커맨드 권한 확인
     */
    async checkCommandPermissions(context, requiredLevel) {
        const { member } = context;
        
        // 관리자는 모든 커맨드 실행 가능
        if (member.permissions.has('Administrator')) {
            return true;
        }
        
        // 권한 레벨별 체크
        switch (requiredLevel) {
            case -1: // 모든 사용자
                return true;
            case 0: // 기본 권한
                return true;
            default:
                // 추가 권한 체크 (기존 시스템과 연동)
                return member.permissions.has('ManageGuild');
        }
    }

    /**
     * 지연 실행을 위한 sleep 메서드
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { BotCommandExecutor };