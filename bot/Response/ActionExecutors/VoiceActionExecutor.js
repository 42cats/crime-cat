const { BaseActionExecutor } = require('./BaseActionExecutor');

/**
 * 음성 관리 액션 실행기
 * move_voice_channel, disconnect_voice, set_voice_mute, set_voice_deafen,
 * toggle_voice_mute, toggle_voice_deafen, set_priority_speaker 액션 처리
 */
class VoiceActionExecutor extends BaseActionExecutor {
    constructor(type) {
        super(type);
        this.requiredPermissions = this.getRequiredPermissions(type);
        this.supportedTargets = ['executor', 'specific', 'role', 'all', 'admin'];
        this.retryable = true;
        this.rollbackable = true;
    }

    /**
     * 액션 타입별 필수 권한 반환
     */
    getRequiredPermissions(type) {
        switch (type) {
            case 'move_voice_channel':
                return ['MOVE_MEMBERS'];
            case 'disconnect_voice':
                return ['MOVE_MEMBERS'];
            case 'set_voice_mute':
            case 'toggle_voice_mute':
                return ['MUTE_MEMBERS'];
            case 'set_voice_deafen':
            case 'toggle_voice_deafen':
                return ['DEAFEN_MEMBERS'];
            case 'set_priority_speaker':
                return ['PRIORITY_SPEAKER'];
            default:
                return [];
        }
    }

    /**
     * 음성 액션 실행
     */
    async performAction(action, context) {
        const { type } = action;
        const { channelId, enable, duration } = action.parameters;

        // 음성 채널 이동 액션의 경우 채널 ID 필수
        if (type === 'move_voice_channel' && !channelId) {
            throw new Error('이동할 음성 채널이 지정되지 않았습니다.');
        }

        // 대상 멤버들 해석
        const targets = await this.resolveTargets(action, context);
        const results = [];

        // 음성 채널 정보 조회 (필요한 경우)
        let targetChannel = null;
        if (channelId) {
            targetChannel = await this.safeDiscordApiCall(
                () => context.guild.channels.fetch(channelId),
                '대상 음성 채널 조회'
            );

            if (!targetChannel || !targetChannel.isVoiceBased()) {
                throw new Error('유효한 음성 채널이 아닙니다.');
            }
        }

        for (const targetMember of targets) {
            try {
                const result = await this.executeVoiceAction(action, context, targetMember, targetChannel);
                results.push({
                    memberId: targetMember.id,
                    success: result.success,
                    message: result.message,
                    previousState: result.previousState,
                    newState: result.newState,
                    skipped: result.skipped
                });

            } catch (error) {
                results.push({
                    memberId: targetMember.id,
                    success: false,
                    message: `음성 처리 실패: ${error.message}`,
                    error: error.message
                });
            }
        }

        // 시간 제한 액션의 경우 타이머 설정
        if (duration && duration > 0) {
            this.scheduleRevert(action, context, results, duration);
        }

        // 실행 결과 요약
        const successCount = results.filter(r => r.success).length;
        const skipCount = results.filter(r => r.skipped).length;
        const failCount = results.filter(r => !r.success && !r.skipped).length;

        return this.formatResult(
            successCount > 0,
            {
                actionType: action.type,
                targetCount: targets.length,
                successCount,
                skipCount,
                failCount,
                duration,
                results
            },
            this.generateSummaryMessage(action.type, successCount, skipCount, failCount, duration),
            successCount === 0 && failCount > 0 ? new Error('모든 대상에 대해 음성 처리가 실패했습니다.') : null
        );
    }

    /**
     * 개별 음성 액션 실행
     */
    async executeVoiceAction(action, context, targetMember, targetChannel) {
        const { guild, member: botMember } = context;
        const { enable } = action.parameters;

        // 서버 소유자는 제외
        if (targetMember.id === guild.ownerId) {
            return {
                success: false,
                message: '서버 소유자에게는 음성 액션을 적용할 수 없습니다.',
                skipped: true
            };
        }

        // 봇보다 높은 권한의 멤버는 제외
        if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
            return {
                success: false,
                message: '봇보다 높은 권한을 가진 멤버에게는 음성 액션을 적용할 수 없습니다.',
                skipped: true
            };
        }

        const voiceState = targetMember.voice;
        let success = false;
        let message = '';
        let previousState = {};
        let newState = {};

        switch (action.type) {
            case 'move_voice_channel':
                if (!voiceState.channel) {
                    return {
                        success: false,
                        message: '음성 채널에 연결되어 있지 않습니다.',
                        skipped: true
                    };
                }

                if (voiceState.channel.id === targetChannel.id) {
                    return {
                        success: true,
                        message: '이미 해당 음성 채널에 있습니다.',
                        previousState: { channelId: voiceState.channel.id },
                        newState: { channelId: targetChannel.id }
                    };
                }

                previousState.channelId = voiceState.channel.id;
                
                await this.safeDiscordApiCall(
                    () => targetMember.voice.setChannel(targetChannel, 'ButtonAutomation: move_voice_channel'),
                    '음성 채널 이동'
                );

                newState.channelId = targetChannel.id;
                success = true;
                message = `${targetChannel.name} 음성 채널로 이동했습니다.`;
                break;

            case 'disconnect_voice':
                if (!voiceState.channel) {
                    return {
                        success: true,
                        message: '이미 음성 채널에 연결되어 있지 않습니다.',
                        previousState: { connected: false },
                        newState: { connected: false }
                    };
                }

                previousState.channelId = voiceState.channel.id;
                previousState.connected = true;

                await this.safeDiscordApiCall(
                    () => targetMember.voice.disconnect('ButtonAutomation: disconnect_voice'),
                    '음성 채널 연결 해제'
                );

                newState.connected = false;
                success = true;
                message = '음성 채널에서 연결을 해제했습니다.';
                break;

            case 'set_voice_mute':
                if (!voiceState.channel) {
                    return {
                        success: false,
                        message: '음성 채널에 연결되어 있지 않습니다.',
                        skipped: true
                    };
                }

                previousState.muted = voiceState.serverMute;
                const muteState = enable !== false;

                if (previousState.muted === muteState) {
                    return {
                        success: true,
                        message: `이미 ${muteState ? '음소거' : '음소거 해제'} 상태입니다.`,
                        previousState,
                        newState: { muted: muteState }
                    };
                }

                await this.safeDiscordApiCall(
                    () => targetMember.voice.setMute(muteState, 'ButtonAutomation: set_voice_mute'),
                    '음성 음소거 설정'
                );

                newState.muted = muteState;
                success = true;
                message = muteState ? '음소거를 설정했습니다.' : '음소거를 해제했습니다.';
                break;

            case 'toggle_voice_mute':
                if (!voiceState.channel) {
                    return {
                        success: false,
                        message: '음성 채널에 연결되어 있지 않습니다.',
                        skipped: true
                    };
                }

                previousState.muted = voiceState.serverMute;
                const toggleMuteState = !previousState.muted;

                await this.safeDiscordApiCall(
                    () => targetMember.voice.setMute(toggleMuteState, 'ButtonAutomation: toggle_voice_mute'),
                    '음성 음소거 토글'
                );

                newState.muted = toggleMuteState;
                success = true;
                message = toggleMuteState ? '음소거를 설정했습니다.' : '음소거를 해제했습니다.';
                break;

            case 'set_voice_deafen':
                if (!voiceState.channel) {
                    return {
                        success: false,
                        message: '음성 채널에 연결되어 있지 않습니다.',
                        skipped: true
                    };
                }

                previousState.deafened = voiceState.serverDeaf;
                const deafenState = enable !== false;

                if (previousState.deafened === deafenState) {
                    return {
                        success: true,
                        message: `이미 ${deafenState ? '스피커 차단' : '스피커 차단 해제'} 상태입니다.`,
                        previousState,
                        newState: { deafened: deafenState }
                    };
                }

                await this.safeDiscordApiCall(
                    () => targetMember.voice.setDeaf(deafenState, 'ButtonAutomation: set_voice_deafen'),
                    '음성 스피커 차단 설정'
                );

                newState.deafened = deafenState;
                success = true;
                message = deafenState ? '스피커를 차단했습니다.' : '스피커 차단을 해제했습니다.';
                break;

            case 'toggle_voice_deafen':
                if (!voiceState.channel) {
                    return {
                        success: false,
                        message: '음성 채널에 연결되어 있지 않습니다.',
                        skipped: true
                    };
                }

                previousState.deafened = voiceState.serverDeaf;
                const toggleDeafenState = !previousState.deafened;

                await this.safeDiscordApiCall(
                    () => targetMember.voice.setDeaf(toggleDeafenState, 'ButtonAutomation: toggle_voice_deafen'),
                    '음성 스피커 차단 토글'
                );

                newState.deafened = toggleDeafenState;
                success = true;
                message = toggleDeafenState ? '스피커를 차단했습니다.' : '스피커 차단을 해제했습니다.';
                break;

            case 'set_priority_speaker':
                // 우선 발언권은 스테이지 채널에서만 사용 가능
                if (!voiceState.channel || voiceState.channel.type !== 13) {
                    return {
                        success: false,
                        message: '스테이지 채널에 연결되어 있지 않습니다.',
                        skipped: true
                    };
                }

                previousState.suppress = voiceState.suppress;
                const suppressState = enable === false;

                await this.safeDiscordApiCall(
                    () => targetMember.voice.setSuppressed(suppressState, 'ButtonAutomation: set_priority_speaker'),
                    '우선 발언권 설정'
                );

                newState.suppress = suppressState;
                success = true;
                message = suppressState ? '우선 발언권을 제거했습니다.' : '우선 발언권을 부여했습니다.';
                break;

            default:
                throw new Error(`지원하지 않는 음성 액션: ${action.type}`);
        }

        return {
            success,
            message,
            previousState,
            newState
        };
    }

    /**
     * 시간 제한 액션 되돌리기 스케줄링
     */
    scheduleRevert(action, context, results, duration) {
        setTimeout(async () => {
            try {
                await this.revertTimedAction(action, context, results);
            } catch (error) {
                console.error(`시간 제한 액션 되돌리기 실패:`, error);
            }
        }, duration * 1000);
    }

    /**
     * 시간 제한 액션 되돌리기
     */
    async revertTimedAction(action, context, results) {
        const { guild } = context;
        
        for (const result of results) {
            if (!result.success || result.skipped) continue;

            try {
                const member = await guild.members.fetch(result.memberId);
                
                // 이전 상태로 복원
                switch (action.type) {
                    case 'set_voice_mute':
                    case 'toggle_voice_mute':
                        if (member.voice.channel && typeof result.previousState.muted === 'boolean') {
                            await member.voice.setMute(result.previousState.muted, 'ButtonAutomation: timed_revert');
                        }
                        break;
                        
                    case 'set_voice_deafen':
                    case 'toggle_voice_deafen':
                        if (member.voice.channel && typeof result.previousState.deafened === 'boolean') {
                            await member.voice.setDeaf(result.previousState.deafened, 'ButtonAutomation: timed_revert');
                        }
                        break;
                }
            } catch (error) {
                console.error(`멤버 ${result.memberId} 시간 제한 되돌리기 실패:`, error);
            }
        }
    }

    /**
     * 결과 메시지 생성
     */
    generateSummaryMessage(actionType, successCount, skipCount, failCount, duration) {
        const actionName = {
            'move_voice_channel': '음성 채널 이동',
            'disconnect_voice': '음성 연결 해제',
            'set_voice_mute': '음성 음소거',
            'toggle_voice_mute': '음성 음소거 토글',
            'set_voice_deafen': '스피커 차단',
            'toggle_voice_deafen': '스피커 차단 토글',
            'set_priority_speaker': '우선 발언권'
        }[actionType] || '음성 처리';

        let message = `${actionName}: `;
        
        const parts = [];
        if (successCount > 0) parts.push(`성공 ${successCount}명`);
        if (skipCount > 0) parts.push(`건너뜀 ${skipCount}명`);
        if (failCount > 0) parts.push(`실패 ${failCount}명`);

        message += parts.join(', ');

        if (duration && duration > 0) {
            message += ` (${duration}초 후 자동 해제)`;
        }

        return message;
    }

    /**
     * 음성 액션 롤백
     */
    async rollback(action, context, executionResult) {
        if (!this.rollbackable) {
            return {
                success: false,
                reason: 'rollback_not_supported',
                message: '이 액션은 롤백을 지원하지 않습니다.'
            };
        }

        const { guild } = context;
        const { results } = executionResult.data;

        if (!results || results.length === 0) {
            return {
                success: true,
                message: '롤백할 작업이 없습니다.',
                rollbackCount: 0
            };
        }

        let rollbackCount = 0;
        const rollbackResults = [];

        for (const result of results) {
            if (!result.success || result.skipped) continue;

            try {
                const member = await guild.members.fetch(result.memberId);
                
                // 액션 타입별 롤백 처리
                await this.executeRollbackByType(action.type, member, result.previousState);
                
                rollbackCount++;
                rollbackResults.push({
                    memberId: result.memberId,
                    success: true,
                    message: '성공적으로 롤백되었습니다.'
                });

            } catch (error) {
                rollbackResults.push({
                    memberId: result.memberId,
                    success: false,
                    message: `롤백 실패: ${error.message}`
                });
            }
        }

        return {
            success: rollbackCount > 0,
            message: `${rollbackCount}건의 음성 액션을 롤백했습니다.`,
            rollbackCount,
            rollbackResults
        };
    }

    /**
     * 액션 타입별 롤백 실행
     */
    async executeRollbackByType(actionType, member, previousState) {
        switch (actionType) {
            case 'move_voice_channel':
                if (previousState.channelId && member.voice.channel) {
                    const originalChannel = await member.guild.channels.fetch(previousState.channelId);
                    if (originalChannel) {
                        await member.voice.setChannel(originalChannel, 'ButtonAutomation: rollback');
                    }
                }
                break;

            case 'set_voice_mute':
            case 'toggle_voice_mute':
                if (member.voice.channel && typeof previousState.muted === 'boolean') {
                    await member.voice.setMute(previousState.muted, 'ButtonAutomation: rollback');
                }
                break;

            case 'set_voice_deafen':
            case 'toggle_voice_deafen':
                if (member.voice.channel && typeof previousState.deafened === 'boolean') {
                    await member.voice.setDeaf(previousState.deafened, 'ButtonAutomation: rollback');
                }
                break;

            case 'set_priority_speaker':
                if (member.voice.channel && typeof previousState.suppress === 'boolean') {
                    await member.voice.setSuppressed(previousState.suppress, 'ButtonAutomation: rollback');
                }
                break;

            // disconnect_voice는 롤백이 어려우므로 제외
        }
    }
}

module.exports = { VoiceActionExecutor };