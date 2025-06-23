const { BaseActionExecutor } = require('./BaseActionExecutor');

/**
 * 모더레이션 액션 실행기
 * remove_timeout, kick_member, ban_member, warn_member 등 모더레이션 액션 처리
 */
class ModerationExecutor extends BaseActionExecutor {
    constructor(type) {
        super(type);
        this.requiredPermissions = this.getRequiredPermissions(type);
        this.supportedTargets = ['executor', 'specific', 'role', 'all', 'admin'];
        this.retryable = true;
        this.rollbackable = this.isRollbackable(type);
    }

    /**
     * 액션 타입별 필수 권한 반환
     */
    getRequiredPermissions(type) {
        switch (type) {
            case 'remove_timeout':
                return ['MODERATE_MEMBERS'];
            case 'kick_member':
                return ['KICK_MEMBERS'];
            case 'ban_member':
                return ['BAN_MEMBERS'];
            case 'warn_member':
                return ['MANAGE_MESSAGES']; // 경고는 메시지 관리 권한으로 충분
            case 'add_timeout':
                return ['MODERATE_MEMBERS'];
            default:
                return [];
        }
    }

    /**
     * 액션 타입별 롤백 가능 여부
     */
    isRollbackable(type) {
        switch (type) {
            case 'remove_timeout':
                return false; // 타임아웃 해제는 롤백 불가
            case 'kick_member':
                return false; // 킥은 롤백 불가
            case 'ban_member':
                return true; // 밴은 언밴으로 롤백 가능
            case 'warn_member':
                return false; // 경고는 롤백 개념 없음
            case 'add_timeout':
                return true; // 타임아웃은 해제로 롤백 가능
            default:
                return false;
        }
    }

    /**
     * 모더레이션 액션 실행
     */
    async performAction(action, context) {
        const { type } = action;
        const { reason, duration, deleteMessageDays } = action.parameters;

        // 대상 멤버들 해석
        const targets = await this.resolveTargets(action, context);
        const results = [];

        for (const targetMember of targets) {
            try {
                const result = await this.executeModerationAction(action, context, targetMember);
                results.push({
                    memberId: targetMember.id,
                    memberName: targetMember.displayName,
                    success: result.success,
                    message: result.message,
                    previousState: result.previousState,
                    newState: result.newState,
                    skipped: result.skipped
                });

            } catch (error) {
                results.push({
                    memberId: targetMember.id,
                    memberName: targetMember.displayName,
                    success: false,
                    message: `모더레이션 처리 실패: ${error.message}`,
                    error: error.message
                });
            }
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
                reason: reason || '사유 없음',
                duration,
                results
            },
            this.generateSummaryMessage(action.type, successCount, skipCount, failCount),
            successCount === 0 && failCount > 0 ? new Error('모든 대상에 대해 모더레이션 처리가 실패했습니다.') : null
        );
    }

    /**
     * 개별 모더레이션 액션 실행
     */
    async executeModerationAction(action, context, targetMember) {
        const { guild } = context;
        const { reason, duration, deleteMessageDays } = action.parameters;
        const moderationReason = reason || `ButtonAutomation: ${action.type}`;

        // 최신 정보로 fetch (권장 방법)
        const botMember = await guild.members.fetch(guild.client.user.id);
        const freshTarget = await guild.members.fetch(targetMember.id);

        // 봇의 권한 확인
        const requiredPermissions = this.getRequiredPermissions(action.type);
        for (const permission of requiredPermissions) {
            if (!botMember.permissions.has(permission)) {
                throw new Error(`봇에게 필요한 권한이 없습니다: ${permission}`);
            }
        }

        // 자기 자신에게는 적용 불가
        if (freshTarget.id === botMember.id) {
            return {
                success: false,
                message: '봇 자신에게는 모더레이션 액션을 적용할 수 없습니다.',
                skipped: true
            };
        }

        // manageable 프로퍼티로 관리 가능 여부 확인 (권장 방법)
        if (!freshTarget.manageable) {
            console.log(`  ⚠️ [모더레이션] 봇이 멤버 "${freshTarget.displayName}"를 관리할 권한이 없으므로 건너뜀`);
            console.log(`    └─ 서버 소유자: ${freshTarget.id === guild.ownerId}`);
            console.log(`    └─ 봇 최고 역할: ${botMember.roles.highest.name}(${botMember.roles.highest.position})`);
            console.log(`    └─ 대상 최고 역할: ${freshTarget.roles.highest.name}(${freshTarget.roles.highest.position})`);
            
            return {
                success: false,
                message: '봇이 이 멤버를 관리할 권한이 없습니다.',
                skipped: true
            };
        }

        let success = false;
        let message = '';
        let previousState = {};
        let newState = {};

        switch (action.type) {
            case 'remove_timeout':
                if (!freshTarget.communicationDisabledUntil) {
                    return {
                        success: true,
                        message: '이미 타임아웃이 설정되어 있지 않습니다.',
                        previousState: { timedOut: false },
                        newState: { timedOut: false }
                    };
                }

                previousState.timedOut = true;
                previousState.timeoutUntil = freshTarget.communicationDisabledUntil;

                await this.safeDiscordApiCall(
                    () => freshTarget.timeout(null, moderationReason),
                    '타임아웃 해제'
                );

                newState.timedOut = false;
                success = true;
                message = '타임아웃을 해제했습니다.';
                break;

            case 'add_timeout':
                if (!duration || duration <= 0) {
                    throw new Error('타임아웃 시간이 지정되지 않았습니다.');
                }

                if (duration > 2419200) { // 28일 최대
                    throw new Error('타임아웃은 최대 28일까지 설정할 수 있습니다.');
                }

                previousState.timedOut = !!freshTarget.communicationDisabledUntil;
                previousState.timeoutUntil = freshTarget.communicationDisabledUntil;

                const timeoutDuration = duration * 1000; // 초를 밀리초로 변환
                await this.safeDiscordApiCall(
                    () => freshTarget.timeout(timeoutDuration, moderationReason),
                    '타임아웃 설정'
                );

                newState.timedOut = true;
                newState.timeoutUntil = new Date(Date.now() + timeoutDuration);
                success = true;
                message = `${this.formatDuration(duration)} 동안 타임아웃을 설정했습니다.`;
                break;

            case 'kick_member':
                previousState.inGuild = true;

                await this.safeDiscordApiCall(
                    () => freshTarget.kick(moderationReason),
                    '멤버 킥'
                );

                newState.inGuild = false;
                success = true;
                message = '서버에서 추방했습니다.';
                break;

            case 'ban_member':
                const deleteMessageDaysParam = Math.min(Math.max(deleteMessageDays || 0, 0), 7);
                
                previousState.banned = false;

                await this.safeDiscordApiCall(
                    () => guild.members.ban(freshTarget, {
                        reason: moderationReason,
                        deleteMessageDays: deleteMessageDaysParam
                    }),
                    '멤버 밴'
                );

                newState.banned = true;
                newState.deleteMessageDays = deleteMessageDaysParam;
                success = true;
                message = `서버에서 차단했습니다.${deleteMessageDaysParam > 0 ? ` (${deleteMessageDaysParam}일간 메시지 삭제)` : ''}`;
                break;

            case 'warn_member':
                // 경고는 실제로는 로그 기록 또는 DM 전송
                const warnMessage = reason || '규칙을 위반했습니다.';
                
                try {
                    await this.safeDiscordApiCall(
                        () => freshTarget.send(`⚠️ **경고**\n서버: ${guild.name}\n사유: ${warnMessage}`),
                        '경고 DM 전송'
                    );
                    
                    success = true;
                    message = '경고를 전송했습니다.';
                } catch (dmError) {
                    // DM 전송 실패 시에도 경고 성공으로 처리
                    success = true;
                    message = '경고를 기록했습니다. (DM 전송 실패)';
                }

                previousState.warned = false;
                newState.warned = true;
                newState.warnReason = warnMessage;
                break;

            default:
                throw new Error(`지원하지 않는 모더레이션 액션: ${action.type}`);
        }

        return {
            success,
            message,
            previousState,
            newState
        };
    }

    /**
     * 시간 포맷팅
     */
    formatDuration(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts = [];
        if (days > 0) parts.push(`${days}일`);
        if (hours > 0) parts.push(`${hours}시간`);
        if (minutes > 0) parts.push(`${minutes}분`);
        if (secs > 0) parts.push(`${secs}초`);

        return parts.join(' ');
    }

    /**
     * 결과 메시지 생성
     */
    generateSummaryMessage(actionType, successCount, skipCount, failCount) {
        const actionName = {
            'remove_timeout': '타임아웃 해제',
            'add_timeout': '타임아웃 설정',
            'kick_member': '멤버 추방',
            'ban_member': '멤버 차단',
            'warn_member': '경고 전송'
        }[actionType] || '모더레이션 처리';

        let message = `${actionName}: `;
        
        const parts = [];
        if (successCount > 0) parts.push(`성공 ${successCount}명`);
        if (skipCount > 0) parts.push(`건너뜀 ${skipCount}명`);
        if (failCount > 0) parts.push(`실패 ${failCount}명`);

        return message + parts.join(', ');
    }

    /**
     * 모더레이션 액션 롤백
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
                await this.executeRollbackByType(action.type, guild, result);
                
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
            message: `${rollbackCount}건의 모더레이션 액션을 롤백했습니다.`,
            rollbackCount,
            rollbackResults
        };
    }

    /**
     * 액션 타입별 롤백 실행
     */
    async executeRollbackByType(actionType, guild, result) {
        switch (actionType) {
            case 'add_timeout':
                // 타임아웃 해제
                const member = await guild.members.fetch(result.memberId);
                if (member && member.communicationDisabledUntil) {
                    await member.timeout(null, 'ButtonAutomation: rollback');
                }
                break;

            case 'ban_member':
                // 밴 해제
                const ban = await guild.bans.fetch(result.memberId).catch(() => null);
                if (ban) {
                    await guild.members.unban(result.memberId, 'ButtonAutomation: rollback');
                }
                break;

            // kick_member, warn_member, remove_timeout은 롤백 불가능
            default:
                throw new Error(`${actionType} 액션은 롤백할 수 없습니다.`);
        }
    }

    /**
     * 액션 유효성 검증 (오버라이드)
     */
    async validate(action, context) {
        await super.validate(action, context);

        // 특정 액션별 추가 검증
        if (action.type === 'add_timeout') {
            const { duration } = action.parameters;
            if (!duration || duration <= 0) {
                throw new Error('타임아웃 시간이 지정되지 않았습니다.');
            }
            if (duration > 2419200) { // 28일
                throw new Error('타임아웃은 최대 28일(2419200초)까지 설정할 수 있습니다.');
            }
        }

        if (action.type === 'ban_member') {
            const { deleteMessageDays } = action.parameters;
            if (deleteMessageDays !== undefined && (deleteMessageDays < 0 || deleteMessageDays > 7)) {
                throw new Error('메시지 삭제 기간은 0~7일 사이여야 합니다.');
            }
        }
    }
}

module.exports = { ModerationExecutor };