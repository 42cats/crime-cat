const { BaseActionExecutor } = require('./ActionExecutors/BaseActionExecutor');

/**
 * 버튼 자동화 액션 실행 엔진
 * 모든 액션 타입을 관리하고 순차적으로 실행
 */
class ButtonAutomationEngine {
    constructor() {
        this.executors = new Map(); // 액션 타입별 실행기
        this.executionHistory = new Map(); // 실행 기록
        this.isInitialized = false;
    }

    /**
     * 엔진 초기화 및 액션 실행기 등록
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // 액션 실행기들을 동적으로 로드하고 등록
            await this.registerExecutors();
            this.isInitialized = true;
            console.log('ButtonAutomationEngine 초기화 완료');
        } catch (error) {
            console.error('ButtonAutomationEngine 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 모든 액션 실행기 등록
     */
    async registerExecutors() {
        try {
            // 역할 관리 액션 (3개)
            const { RoleActionExecutor } = require('./ActionExecutors/RoleActionExecutor');
            this.executors.set('add_role', new RoleActionExecutor('add_role'));
            this.executors.set('remove_role', new RoleActionExecutor('remove_role'));
            this.executors.set('toggle_role', new RoleActionExecutor('toggle_role'));

            // 닉네임 관리 액션 (2개)
            const { NicknameActionExecutor } = require('./ActionExecutors/NicknameActionExecutor');
            this.executors.set('change_nickname', new NicknameActionExecutor('change_nickname'));
            this.executors.set('reset_nickname', new NicknameActionExecutor('reset_nickname'));

            // 메시지 관리 액션 (2개)
            const { MessageActionExecutor } = require('./ActionExecutors/MessageActionExecutor');
            this.executors.set('send_message', new MessageActionExecutor('send_message'));
            this.executors.set('send_dm', new MessageActionExecutor('send_dm'));

            // 음성 관리 액션 (7개)
            const { VoiceActionExecutor } = require('./ActionExecutors/VoiceActionExecutor');
            this.executors.set('move_voice_channel', new VoiceActionExecutor('move_voice_channel'));
            this.executors.set('disconnect_voice', new VoiceActionExecutor('disconnect_voice'));
            this.executors.set('set_voice_mute', new VoiceActionExecutor('set_voice_mute'));
            this.executors.set('set_voice_deafen', new VoiceActionExecutor('set_voice_deafen'));
            this.executors.set('toggle_voice_mute', new VoiceActionExecutor('toggle_voice_mute'));
            this.executors.set('toggle_voice_deafen', new VoiceActionExecutor('toggle_voice_deafen'));
            this.executors.set('set_priority_speaker', new VoiceActionExecutor('set_priority_speaker'));

            // 채널 권한 관리 액션 (4개)
            const { ChannelPermissionExecutor } = require('./ActionExecutors/ChannelPermissionExecutor');
            this.executors.set('set_channel_permission', new ChannelPermissionExecutor('set_channel_permission'));
            this.executors.set('remove_channel_permission', new ChannelPermissionExecutor('remove_channel_permission'));
            this.executors.set('override_channel_permission', new ChannelPermissionExecutor('override_channel_permission'));
            this.executors.set('reset_channel_permission', new ChannelPermissionExecutor('reset_channel_permission'));

            // 모더레이션 액션 (1개)
            const { ModerationExecutor } = require('./ActionExecutors/ModerationExecutor');
            this.executors.set('remove_timeout', new ModerationExecutor('remove_timeout'));

            // 음악 관리 액션 (3개) - 기존 시스템 개선
            const { MusicActionExecutor } = require('./ActionExecutors/MusicActionExecutor');
            this.executors.set('play_music', new MusicActionExecutor('play_music'));
            this.executors.set('stop_music', new MusicActionExecutor('stop_music'));
            this.executors.set('pause_music', new MusicActionExecutor('pause_music'));

            // 버튼 설정 액션 (1개)
            const { ButtonSettingExecutor } = require('./ActionExecutors/ButtonSettingExecutor');
            this.executors.set('button_setting', new ButtonSettingExecutor('button_setting'));

            console.log(`액션 실행기 ${this.executors.size}개 등록 완료`);
        } catch (error) {
            console.error('액션 실행기 등록 실패:', error);
            // 필수 실행기가 로드되지 않은 경우 기본 실행기라도 등록
            this.registerFallbackExecutors();
        }
    }

    /**
     * 기본 실행기 등록 (실행기 로드 실패 시)
     */
    registerFallbackExecutors() {
        // 기본 더미 실행기
        class FallbackExecutor extends BaseActionExecutor {
            async performAction(action, context) {
                return this.formatResult(false, {}, 
                    `액션 타입 '${action.type}'의 실행기가 아직 구현되지 않았습니다.`, 
                    new Error('NOT_IMPLEMENTED')
                );
            }
        }

        // 구현되지 않은 액션들을 위한 폴백 실행기
        const fallbackTypes = [
            'add_role', 'remove_role', 'toggle_role',
            'change_nickname', 'reset_nickname',
            'send_message', 'send_dm',
            'move_voice_channel', 'disconnect_voice',
            'set_voice_mute', 'set_voice_deafen',
            'toggle_voice_mute', 'toggle_voice_deafen',
            'set_priority_speaker',
            'set_channel_permission', 'remove_channel_permission',
            'override_channel_permission', 'reset_channel_permission',
            'remove_timeout',
            'play_music', 'stop_music', 'pause_music'
        ];

        fallbackTypes.forEach(type => {
            if (!this.executors.has(type)) {
                this.executors.set(type, new FallbackExecutor(type));
            }
        });

        console.log('폴백 실행기 등록 완료');
    }

    /**
     * 여러 액션을 순차적으로 실행
     * @param {Array} actions - 실행할 액션 배열
     * @param {Object} context - 실행 컨텍스트
     * @returns {Object} 전체 실행 결과
     */
    async executeActions(actions, context) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const executionId = `${context.guildId || 'unknown'}_${context.buttonId || 'unknown'}_${Date.now()}`;
        const execution = {
            id: executionId,
            guildId: context.guildId,
            buttonId: context.buttonId,
            userId: context.user?.id,
            actions,
            results: [],
            status: 'pending',
            startTime: Date.now(),
            endTime: null,
            duration: null,
            successCount: 0,
            failCount: 0
        };

        // 실행 기록에 추가
        this.executionHistory.set(executionId, execution);

        try {
            execution.status = 'running';
            console.log(`액션 실행 시작 (${executionId}): ${actions.length}개 액션`);

            // 각 액션을 순차적으로 실행
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                
                try {
                    // 지연 처리
                    if (action.delay && action.delay > 0) {
                        console.log(`액션 ${i + 1} 지연 대기: ${action.delay}초`);
                        await this.delay(action.delay * 1000);
                    }

                    // 액션 실행
                    console.log(`액션 ${i + 1} 실행 중: ${action.type}`);
                    const result = await this.executeSingleAction(action, context, i);
                    execution.results.push(result);

                    // 성공/실패 카운트
                    if (result.success) {
                        execution.successCount++;
                    } else {
                        execution.failCount++;
                    }

                    // 실패 시 중단 여부 결정
                    if (!result.success && !result.continuable) {
                        console.log(`치명적 오류로 실행 중단: ${result.error?.message}`);
                        execution.status = 'failed';
                        break;
                    }

                    // 결과 메시지 전송
                    if (action.result && action.result.message && action.result.visibility !== 'none') {
                        await this.sendResultMessage(action.result, context, result);
                    }

                } catch (error) {
                    console.error(`액션 ${i + 1} 실행 오류:`, error);
                    const errorResult = {
                        success: false,
                        actionType: action.type,
                        actionIndex: i,
                        error: {
                            message: error.message,
                            stack: error.stack
                        },
                        continuable: false
                    };
                    execution.results.push(errorResult);
                    execution.failCount++;
                    
                    // 치명적 에러로 중단
                    execution.status = 'error';
                    break;
                }
            }

            // 전체 실행 완료
            if (execution.status === 'running') {
                execution.status = execution.failCount > 0 ? 'partial_success' : 'completed';
            }

        } catch (error) {
            console.error('액션 실행 엔진 오류:', error);
            execution.status = 'engine_error';
            execution.error = {
                message: error.message,
                stack: error.stack
            };
        } finally {
            // 실행 시간 기록
            execution.endTime = Date.now();
            execution.duration = execution.endTime - execution.startTime;
            
            console.log(`액션 실행 완료 (${executionId}): ${execution.status}, 성공 ${execution.successCount}/${actions.length}, 소요시간 ${execution.duration}ms`);
        }

        return execution;
    }

    /**
     * 단일 액션 실행
     * @param {Object} action - 실행할 액션
     * @param {Object} context - 실행 컨텍스트
     * @param {Number} actionIndex - 액션 인덱스
     * @returns {Object} 실행 결과
     */
    async executeSingleAction(action, context, actionIndex) {
        const executor = this.executors.get(action.type);
        
        if (!executor) {
            return {
                success: false,
                actionType: action.type,
                actionIndex,
                error: {
                    message: `지원하지 않는 액션 타입: ${action.type}`,
                    code: 'UNSUPPORTED_ACTION_TYPE'
                },
                continuable: false
            };
        }

        try {
            const result = await executor.execute(action, context);
            return {
                success: true,
                actionType: action.type,
                actionIndex,
                result,
                continuable: true
            };
        } catch (error) {
            return {
                success: false,
                actionType: action.type,
                actionIndex,
                error: {
                    message: error.message,
                    stack: error.stack,
                    retryable: executor.retryable || false
                },
                continuable: executor.retryable || false
            };
        }
    }

    /**
     * 결과 메시지 전송
     * @param {Object} resultConfig - 결과 설정
     * @param {Object} context - 실행 컨텍스트
     * @param {Object} actionResult - 액션 실행 결과
     */
    async sendResultMessage(resultConfig, context, actionResult) {
        if (!resultConfig.message || resultConfig.visibility === 'none') {
            return;
        }

        try {
            // 메시지 변수 치환
            const processedMessage = this.processMessageVariables(
                resultConfig.message, 
                context, 
                actionResult
            );

            // 전송 대상에 따른 메시지 전송
            switch (resultConfig.visibility) {
                case 'private':
                    await context.user.send(processedMessage);
                    break;

                case 'current_channel':
                    await context.channel.send(processedMessage);
                    break;

                case 'specific_channel':
                    if (resultConfig.channelId) {
                        const targetChannel = await context.guild.channels.fetch(resultConfig.channelId);
                        if (targetChannel && targetChannel.isTextBased()) {
                            await targetChannel.send(processedMessage);
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('결과 메시지 전송 실패:', error);
        }
    }

    /**
     * 메시지 변수 치환
     * @param {String} message - 원본 메시지
     * @param {Object} context - 실행 컨텍스트
     * @param {Object} actionResult - 액션 실행 결과
     * @returns {String} 치환된 메시지
     */
    processMessageVariables(message, context, actionResult) {
        return message
            .replace(/{user}/g, `<@${context.user.id}>`)
            .replace(/{username}/g, context.user.username || context.user.displayName)
            .replace(/{guild}/g, context.guild.name)
            .replace(/{channel}/g, `<#${context.channel.id}>`)
            .replace(/{button}/g, context.buttonLabel || '버튼')
            .replace(/{result}/g, actionResult?.result?.summary || '완료');
    }

    /**
     * 지연 처리
     * @param {Number} ms - 지연 시간 (밀리초)
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 특정 실행 기록 조회
     * @param {String} executionId - 실행 ID
     * @returns {Object|null} 실행 기록
     */
    getExecutionHistory(executionId) {
        return this.executionHistory.get(executionId) || null;
    }

    /**
     * 최근 실행 기록 조회
     * @param {Number} limit - 조회할 개수
     * @returns {Array} 실행 기록 배열
     */
    getRecentExecutions(limit = 10) {
        const executions = Array.from(this.executionHistory.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
        
        return executions;
    }

    /**
     * 실행 기록 정리 (메모리 관리)
     * @param {Number} maxAge - 최대 보관 시간 (밀리초)
     */
    cleanupExecutionHistory(maxAge = 24 * 60 * 60 * 1000) { // 기본 24시간
        const cutoff = Date.now() - maxAge;
        
        for (const [id, execution] of this.executionHistory.entries()) {
            if (execution.startTime < cutoff) {
                this.executionHistory.delete(id);
            }
        }
    }

    /**
     * 엔진 상태 조회
     * @returns {Object} 엔진 상태 정보
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            executorCount: this.executors.size,
            executionHistoryCount: this.executionHistory.size,
            supportedActions: Array.from(this.executors.keys())
        };
    }
}

module.exports = { ButtonAutomationEngine };