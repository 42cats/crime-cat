const { BaseActionExecutor } = require('./BaseActionExecutor');
const { EmbedBuilder } = require('discord.js');

/**
 * 메시지 전송 액션 실행기
 * send_message, send_dm 액션 처리
 */
class MessageActionExecutor extends BaseActionExecutor {
    static name = 'message';
    
    constructor(type) {
        super(type);
        this.requiredPermissions = type === 'send_message' ? ['SEND_MESSAGES'] : [];
        this.supportedTargets = ['executor', 'specific', 'role', 'all', 'channel'];
        this.retryable = true;
        this.rollbackable = false; // 메시지는 롤백 불가
    }

    /**
     * 메시지 액션 실행
     */
    async performAction(action, context) {
        const { type } = action;
        const { message, channelId, embed } = action.parameters;

        if (!message && !embed) {
            throw new Error('메시지 내용 또는 임베드가 지정되지 않았습니다.');
        }

        if (type === 'send_message' && !channelId) {
            throw new Error('메시지를 전송할 채널이 지정되지 않았습니다.');
        }

        // 대상 멤버들 해석
        const targets = await this.resolveTargets(action, context);
        
        // 빈 대상 처리
        if (targets.length === 0 && type === 'send_dm') {
            console.log(`ℹ️ [메시지] DM을 전송할 대상이 없어 건너뜀`);
            return this.formatResult(true, {
                actionType: type,
                targetCount: 0,
                successCount: 0,
                failCount: 0,
                results: [],
                summary: 'DM을 전송할 대상이 없습니다.'
            }, 'DM을 전송할 대상이 없어 건너뛰었습니다.');
        }
        
        const results = [];

        if (type === 'send_message') {
            // 채널 메시지 전송
            const result = await this.sendChannelMessage(action, context, targets);
            results.push(result);
        } else if (type === 'send_dm') {
            // 개별 DM 전송
            for (const targetMember of targets) {
                const result = await this.sendDirectMessage(action, context, targetMember);
                results.push(result);
            }
        }

        // 실행 결과 요약
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        // 성공 조건: 실패가 없거나, 성공이 있으면 성공
        const isSuccess = failCount === 0 || successCount > 0;
        
        return this.formatResult(
            isSuccess,
            {
                actionType: action.type,
                targetCount: targets.length,
                successCount,
                failCount,
                results
            },
            this.generateSummaryMessage(action.type, successCount, failCount, targets.length),
            successCount === 0 ? new Error('모든 메시지 전송이 실패했습니다.') : null
        );
    }

    /**
     * 채널 메시지 전송
     */
    async sendChannelMessage(action, context, targets) {
        const { guild } = context;
        const { channelId, message, embed } = action.parameters;

        try {
            // 대상 채널 조회
            const targetChannel = await this.safeDiscordApiCall(
                () => guild.channels.fetch(channelId),
                '대상 채널 조회'
            );

            if (!targetChannel) {
                throw new Error(`채널을 찾을 수 없습니다: ${channelId}`);
            }

            if (!targetChannel.isTextBased()) {
                throw new Error('텍스트 채널이 아닙니다.');
            }

            // 메시지 내용 처리
            const processedMessage = this.processMessageVariables(message || '', context);
            
            // 메시지 옵션 구성
            const messageOptions = {};
            
            if (processedMessage) {
                messageOptions.content = processedMessage;
            }

            if (embed) {
                messageOptions.embeds = [this.createEmbed(embed, context)];
            }

            // 메시지 전송
            const sentMessage = await this.safeDiscordApiCall(
                () => targetChannel.send(messageOptions),
                '채널 메시지 전송'
            );

            return {
                success: true,
                channelId: targetChannel.id,
                channelName: targetChannel.name,
                messageId: sentMessage.id,
                targetCount: targets.length,
                message: `${targetChannel.name} 채널에 메시지를 전송했습니다.`
            };

        } catch (error) {
            return {
                success: false,
                channelId,
                error: error.message,
                message: `채널 메시지 전송 실패: ${error.message}`
            };
        }
    }

    /**
     * 개별 DM 전송
     */
    async sendDirectMessage(action, context, targetMember) {
        const { message, embed } = action.parameters;

        try {
            // 봇 자신에게는 DM 전송 안함
            if (targetMember.user.bot) {
                return {
                    success: false,
                    memberId: targetMember.id,
                    message: '봇에게는 DM을 전송할 수 없습니다.',
                    skipped: true
                };
            }

            // 메시지 내용 처리
            const processedMessage = this.processMessageVariables(message || '', context);
            
            // 메시지 옵션 구성
            const messageOptions = {};
            
            if (processedMessage) {
                messageOptions.content = processedMessage;
            }

            if (embed) {
                messageOptions.embeds = [this.createEmbed(embed, context)];
            }

            // DM 전송
            const sentMessage = await this.safeDiscordApiCall(
                () => targetMember.send(messageOptions),
                'DM 전송'
            );

            return {
                success: true,
                memberId: targetMember.id,
                memberName: targetMember.displayName,
                messageId: sentMessage.id,
                message: `${targetMember.displayName}님에게 DM을 전송했습니다.`
            };

        } catch (error) {
            // DM 차단 등의 경우
            if (error.code === 50007) {
                return {
                    success: false,
                    memberId: targetMember.id,
                    memberName: targetMember.displayName,
                    message: `${targetMember.displayName}님이 DM을 차단했거나 받을 수 없습니다.`,
                    error: 'DM_BLOCKED'
                };
            }

            return {
                success: false,
                memberId: targetMember.id,
                memberName: targetMember.displayName,
                error: error.message,
                message: `${targetMember.displayName}님에게 DM 전송 실패: ${error.message}`
            };
        }
    }

    /**
     * 임베드 생성
     */
    createEmbed(embedConfig, context) {
        const embed = new EmbedBuilder();

        if (embedConfig.title) {
            embed.setTitle(this.processMessageVariables(embedConfig.title, context));
        }

        if (embedConfig.description) {
            embed.setDescription(this.processMessageVariables(embedConfig.description, context));
        }

        if (embedConfig.color) {
            embed.setColor(embedConfig.color);
        }

        if (embedConfig.thumbnail) {
            embed.setThumbnail(embedConfig.thumbnail);
        }

        if (embedConfig.image) {
            embed.setImage(embedConfig.image);
        }

        if (embedConfig.footer) {
            embed.setFooter({
                text: this.processMessageVariables(embedConfig.footer.text || '', context),
                iconURL: embedConfig.footer.iconURL
            });
        }

        if (embedConfig.author) {
            embed.setAuthor({
                name: this.processMessageVariables(embedConfig.author.name || '', context),
                iconURL: embedConfig.author.iconURL,
                url: embedConfig.author.url
            });
        }

        if (embedConfig.fields && Array.isArray(embedConfig.fields)) {
            embedConfig.fields.forEach(field => {
                embed.addFields({
                    name: this.processMessageVariables(field.name || '', context),
                    value: this.processMessageVariables(field.value || '', context),
                    inline: field.inline || false
                });
            });
        }

        embed.setTimestamp();

        return embed;
    }

    /**
     * 결과 메시지 생성
     */
    generateSummaryMessage(actionType, successCount, failCount, totalCount) {
        const actionName = {
            'send_message': '채널 메시지 전송',
            'send_dm': 'DM 전송'
        }[actionType] || '메시지 전송';

        if (actionType === 'send_message') {
            return successCount > 0 ? 
                `${actionName} 완료` : 
                `${actionName} 실패`;
        } else {
            let message = `${actionName}: `;
            
            const parts = [];
            if (successCount > 0) parts.push(`성공 ${successCount}명`);
            if (failCount > 0) parts.push(`실패 ${failCount}명`);

            return message + parts.join(', ') + ` (총 ${totalCount}명)`;
        }
    }

    /**
     * 메시지 변수 확장 처리
     */
    processMessageVariables(message, context, additionalVars = {}) {
        if (!message) return '';

        let processed = super.processMessageVariables(message, context);

        // 추가 변수 처리
        Object.entries(additionalVars).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            processed = processed.replace(regex, value);
        });

        return processed;
    }
}

module.exports = { MessageActionExecutor };