const { BaseActionExecutor } = require('./BaseActionExecutor');

/**
 * 닉네임 관리 액션 실행기
 * change_nickname, reset_nickname 액션 처리
 */
class NicknameActionExecutor extends BaseActionExecutor {
    constructor(type) {
        super(type);
        this.requiredPermissions = ['MANAGE_NICKNAMES'];
        this.supportedTargets = ['executor', 'specific', 'role', 'all', 'admin'];
        this.retryable = true;
        this.rollbackable = true;
    }

    /**
     * 닉네임 액션 실행
     */
    async performAction(action, context) {
        const { type } = action;
        const { nickname } = action.parameters;

        if (type === 'change_nickname' && !nickname) {
            throw new Error('새 닉네임이 지정되지 않았습니다.');
        }

        // 대상 멤버들 해석
        const targets = await this.resolveTargets(action, context);
        const results = [];

        for (const targetMember of targets) {
            try {
                const result = await this.executeNicknameAction(action, context, targetMember);
                results.push({
                    memberId: targetMember.id,
                    success: result.success,
                    message: result.message,
                    previousNickname: result.previousNickname,
                    newNickname: result.newNickname,
                    skipped: result.skipped
                });

            } catch (error) {
                results.push({
                    memberId: targetMember.id,
                    success: false,
                    message: `닉네임 처리 실패: ${error.message}`,
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
                results
            },
            this.generateSummaryMessage(action.type, successCount, skipCount, failCount),
            successCount === 0 && failCount > 0 ? new Error('모든 대상에 대해 닉네임 처리가 실패했습니다.') : null
        );
    }

    /**
     * 개별 닉네임 액션 실행
     */
    async executeNicknameAction(action, context, targetMember) {
        const { guild, member: botMember } = context;
        const { nickname: rawNickname } = action.parameters;

        // 서버 소유자는 제외
        if (targetMember.id === guild.ownerId) {
            return {
                success: false,
                message: '서버 소유자의 닉네임은 변경할 수 없습니다.',
                skipped: true,
                previousNickname: targetMember.displayName,
                newNickname: targetMember.displayName
            };
        }

        // 봇보다 높은 권한의 멤버는 제외
        if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
            return {
                success: false,
                message: '봇보다 높은 권한을 가진 멤버의 닉네임은 변경할 수 없습니다.',
                skipped: true,
                previousNickname: targetMember.displayName,
                newNickname: targetMember.displayName
            };
        }

        const previousNickname = targetMember.nickname;
        const previousDisplayName = targetMember.displayName;
        let newNickname = null;
        let success = false;
        let message = '';

        switch (action.type) {
            case 'change_nickname':
                // 닉네임 변수 치환
                newNickname = this.processNicknameVariables(rawNickname, targetMember, context);
                
                // 닉네임 길이 검증 (32자 제한)
                if (newNickname.length > 32) {
                    return {
                        success: false,
                        message: '닉네임은 32자를 초과할 수 없습니다.',
                        previousNickname,
                        newNickname: previousDisplayName
                    };
                }

                // 현재 닉네임과 동일한지 확인
                if (newNickname === previousDisplayName) {
                    return {
                        success: true,
                        message: '이미 동일한 닉네임입니다.',
                        previousNickname,
                        newNickname
                    };
                }

                await this.safeDiscordApiCall(
                    () => targetMember.setNickname(newNickname, 'ButtonAutomation: change_nickname'),
                    '닉네임 변경'
                );

                success = true;
                message = `닉네임을 "${newNickname}"으로 변경했습니다.`;
                break;

            case 'reset_nickname':
                if (!previousNickname) {
                    return {
                        success: true,
                        message: '이미 기본 닉네임입니다.',
                        previousNickname,
                        newNickname: targetMember.user.username
                    };
                }

                await this.safeDiscordApiCall(
                    () => targetMember.setNickname(null, 'ButtonAutomation: reset_nickname'),
                    '닉네임 초기화'
                );

                success = true;
                newNickname = targetMember.user.username;
                message = '닉네임을 초기화했습니다.';
                break;

            default:
                throw new Error(`지원하지 않는 닉네임 액션: ${action.type}`);
        }

        return {
            success,
            message,
            previousNickname,
            newNickname
        };
    }

    /**
     * 닉네임 변수 치환
     */
    processNicknameVariables(nickname, targetMember, context) {
        if (!nickname) return '';

        return nickname
            .replace(/{user}/g, `<@${targetMember.id}>`)
            .replace(/{username}/g, targetMember.user.username)
            .replace(/{displayName}/g, targetMember.displayName)
            .replace(/{guild}/g, context.guild.name)
            .replace(/{channel}/g, `<#${context.channel.id}>`)
            .replace(/{button}/g, context.buttonLabel || '버튼')
            .replace(/{discriminator}/g, targetMember.user.discriminator || '0000')
            .replace(/{tag}/g, targetMember.user.tag)
            .replace(/{id}/g, targetMember.id);
    }

    /**
     * 결과 메시지 생성
     */
    generateSummaryMessage(actionType, successCount, skipCount, failCount) {
        const actionName = {
            'change_nickname': '닉네임 변경',
            'reset_nickname': '닉네임 초기화'
        }[actionType] || '닉네임 처리';

        let message = `${actionName}: `;
        
        const parts = [];
        if (successCount > 0) parts.push(`성공 ${successCount}명`);
        if (skipCount > 0) parts.push(`건너뜀 ${skipCount}명`);
        if (failCount > 0) parts.push(`실패 ${failCount}명`);

        return message + parts.join(', ');
    }

    /**
     * 닉네임 액션 롤백
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
                
                // 이전 닉네임으로 복원
                await this.safeDiscordApiCall(
                    () => member.setNickname(result.previousNickname, 'ButtonAutomation: rollback'),
                    '닉네임 롤백'
                );

                rollbackCount++;
                rollbackResults.push({
                    memberId: result.memberId,
                    success: true,
                    message: '성공적으로 롤백되었습니다.',
                    restoredNickname: result.previousNickname
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
            message: `${rollbackCount}건의 닉네임 변경을 롤백했습니다.`,
            rollbackCount,
            rollbackResults
        };
    }
}

module.exports = { NicknameActionExecutor };