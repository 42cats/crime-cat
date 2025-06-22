const { BaseActionExecutor } = require('./BaseActionExecutor');
const { PermissionsBitField } = require('discord.js');

/**
 * 역할 관리 액션 실행기
 * add_role, remove_role, toggle_role 액션 처리
 */
class RoleActionExecutor extends BaseActionExecutor {
    constructor(type) {
        super(type);
        this.requiredPermissions = ['MANAGE_ROLES'];
        this.supportedTargets = ['executor', 'specific', 'role', 'all', 'admin'];
        this.retryable = true;
        this.rollbackable = true;
    }

    /**
     * 역할 액션 실행
     */
    async performAction(action, context) {
        const { guild } = context;
        const { roleId, roleIds } = action.parameters;
        
        // 봇의 멤버 정보 조회 (context.member는 버튼을 누른 사용자임!)
        const botMember = await guild.members.fetch(guild.client.user.id);

        // 멀티 역할 지원: roleIds 배열 우선, 없으면 roleId 사용
        const targetRoleIds = roleIds && roleIds.length > 0 ? roleIds : [roleId];
        
        if (!targetRoleIds || targetRoleIds.length === 0 || !targetRoleIds[0]) {
            throw new Error('역할 ID가 지정되지 않았습니다.');
        }

        console.log(`🎯 [역할처리] 처리할 역할 목록: ${targetRoleIds.length}개 - ${targetRoleIds.join(', ')}`);

        const allResults = [];
        let totalSuccessCount = 0;
        let totalSkipCount = 0;
        let totalFailCount = 0;

        // 각 역할에 대해 순차 처리
        for (let i = 0; i < targetRoleIds.length; i++) {
            const currentRoleId = targetRoleIds[i];
            if (!currentRoleId) continue;

            console.log(`🔄 [역할처리] ${i + 1}/${targetRoleIds.length} 역할 처리 중: ${currentRoleId}`);

            try {
                // 대상 역할 조회
                const targetRole = await this.safeDiscordApiCall(
                    () => guild.roles.fetch(currentRoleId),
                    '대상 역할 조회'
                );

                if (!targetRole) {
                    console.error(`❌ [역할처리] 역할을 찾을 수 없음: ${currentRoleId}`);
                    allResults.push({
                        roleId: currentRoleId,
                        roleName: '알 수 없음',
                        success: false,
                        message: `역할을 찾을 수 없습니다: ${currentRoleId}`,
                        results: []
                    });
                    totalFailCount++;
                    continue;
                }

                // 개별 역할 처리 결과
                const roleResult = await this.processSingleRole(action, context, targetRole, botMember);
                allResults.push(roleResult);
                
                totalSuccessCount += roleResult.successCount;
                totalSkipCount += roleResult.skipCount;
                totalFailCount += roleResult.failCount;

            } catch (error) {
                console.error(`❌ [역할처리] 역할 ${currentRoleId} 처리 중 오류:`, error);
                allResults.push({
                    roleId: currentRoleId,
                    roleName: '알 수 없음',
                    success: false,
                    message: `역할 처리 실패: ${error.message}`,
                    results: []
                });
                totalFailCount++;
            }
        }

        console.log(`✅ [역할처리] 전체 처리 완료 - 성공: ${totalSuccessCount}, 건너뜀: ${totalSkipCount}, 실패: ${totalFailCount}`);

        return this.formatResult(
            totalSuccessCount > 0,
            {
                actionType: action.type,
                processedRoles: allResults,
                totalTargetRoles: targetRoleIds.length,
                totalSuccessCount,
                totalSkipCount,
                totalFailCount
            },
            this.generateMultiRoleSummaryMessage(action.type, allResults, totalSuccessCount, totalSkipCount, totalFailCount),
            totalSuccessCount === 0 && totalFailCount > 0 ? new Error('모든 역할에 대해 처리가 실패했습니다.') : null
        );
    }

    /**
     * 단일 역할에 대한 처리
     */
    async processSingleRole(action, context, targetRole, botMember) {
        const { guild } = context;

        // 봇의 모든 역할 정보 출력 (디버깅용)
        console.log(`🔍 [역할권한] 봇의 모든 역할:`, {
            botId: botMember.id,
            botTag: guild.client.user.tag,
            roles: botMember.roles.cache.map(role => ({
                id: role.id,
                name: role.name,
                position: role.position,
                permissions: role.permissions.toArray().slice(0, 5) // 처음 5개만
            })),
            highestRole: {
                name: botMember.roles.highest.name,
                position: botMember.roles.highest.position
            }
        });

        // 봇의 권한 확인
        const botHighestRole = botMember.roles.highest;
        
        if (targetRole.position >= botHighestRole.position) {
            // 오류 시에만 상세한 디버그 정보 출력
            console.error(`❌ [역할권한] 권한 부족:`, {
                botRole: { name: botHighestRole.name, position: botHighestRole.position },
                targetRole: { name: targetRole.name, position: targetRole.position },
                botAllRoles: botMember.roles.cache.map(r => `${r.name}(${r.position})`),
                solution: '봇에게 적절한 역할을 할당하거나 역할 위치를 조정해주세요'
            });
            
            const errorMsg = `봇보다 높은 위치의 역할은 관리할 수 없습니다.\n` +
                           `💡 해결방법: Discord 서버에서 봇에게 적절한 역할을 할당하고 "${targetRole.name}" 역할보다 위로 이동시켜주세요.\n` +
                           `현재: 봇="${botHighestRole.name}"(${botHighestRole.position}) < 대상="${targetRole.name}"(${targetRole.position})\n` +
                           `봇의 모든 역할: ${botMember.roles.cache.map(r => `${r.name}(${r.position})`).join(', ')}`;
            throw new Error(errorMsg);
        }

        console.log(`✅ [역할권한] 권한 확인 완료: 봇="${botHighestRole.name}"(${botHighestRole.position}) > 대상="${targetRole.name}"(${targetRole.position})`);

        // 대상 멤버들 해석
        const targets = await this.resolveTargets(action, context);
        const results = [];

        for (const targetMember of targets) {
            try {
                // 서버 소유자는 제외
                if (targetMember.id === guild.ownerId) {
                    results.push({
                        memberId: targetMember.id,
                        success: false,
                        message: '서버 소유자의 역할은 변경할 수 없습니다.',
                        skipped: true
                    });
                    continue;
                }

                // 봇보다 높은 권한의 멤버는 제외
                if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
                    results.push({
                        memberId: targetMember.id,
                        success: false,
                        message: '봇보다 높은 권한을 가진 멤버의 역할은 변경할 수 없습니다.',
                        skipped: true
                    });
                    continue;
                }

                const result = await this.executeRoleAction(action.type, targetMember, targetRole);
                results.push({
                    memberId: targetMember.id,
                    success: result.success,
                    message: result.message,
                    previousState: result.previousState,
                    newState: result.newState
                });

            } catch (error) {
                results.push({
                    memberId: targetMember.id,
                    success: false,
                    message: `역할 처리 실패: ${error.message}`,
                    error: error.message
                });
            }
        }

        // 실행 결과 요약
        const successCount = results.filter(r => r.success).length;
        const skipCount = results.filter(r => r.skipped).length;
        const failCount = results.filter(r => !r.success && !r.skipped).length;

        return {
            roleId: targetRole.id,
            roleName: targetRole.name,
            successCount,
            skipCount,
            failCount,
            results,
            summary: this.generateSummaryMessage(action.type, targetRole.name, successCount, skipCount, failCount)
        };
    }

    /**
     * 개별 역할 액션 실행
     */
    async executeRoleAction(actionType, member, role) {
        const hasRole = member.roles.cache.has(role.id);
        let success = false;
        let message = '';
        let newState = hasRole;

        switch (actionType) {
            case 'add_role':
                if (hasRole) {
                    success = true;
                    message = `이미 ${role.name} 역할을 가지고 있습니다.`;
                } else {
                    await this.safeDiscordApiCall(
                        () => member.roles.add(role, 'ButtonAutomation: add_role'),
                        '역할 추가'
                    );
                    success = true;
                    newState = true;
                    message = `${role.name} 역할을 추가했습니다.`;
                }
                break;

            case 'remove_role':
                if (!hasRole) {
                    success = true;
                    message = `${role.name} 역할을 가지고 있지 않습니다.`;
                } else {
                    await this.safeDiscordApiCall(
                        () => member.roles.remove(role, 'ButtonAutomation: remove_role'),
                        '역할 제거'
                    );
                    success = true;
                    newState = false;
                    message = `${role.name} 역할을 제거했습니다.`;
                }
                break;

            case 'toggle_role':
                if (hasRole) {
                    await this.safeDiscordApiCall(
                        () => member.roles.remove(role, 'ButtonAutomation: toggle_role'),
                        '역할 토글 (제거)'
                    );
                    newState = false;
                    message = `${role.name} 역할을 제거했습니다.`;
                } else {
                    await this.safeDiscordApiCall(
                        () => member.roles.add(role, 'ButtonAutomation: toggle_role'),
                        '역할 토글 (추가)'
                    );
                    newState = true;
                    message = `${role.name} 역할을 추가했습니다.`;
                }
                success = true;
                break;

            default:
                throw new Error(`지원하지 않는 역할 액션: ${actionType}`);
        }

        return {
            success,
            message,
            previousState: hasRole,
            newState
        };
    }

    /**
     * 결과 메시지 생성
     */
    generateSummaryMessage(actionType, roleName, successCount, skipCount, failCount) {
        const actionName = {
            'add_role': '추가',
            'remove_role': '제거',
            'toggle_role': '토글'
        }[actionType] || '처리';

        let message = `${roleName} 역할 ${actionName}: `;
        
        const parts = [];
        if (successCount > 0) parts.push(`성공 ${successCount}명`);
        if (skipCount > 0) parts.push(`건너뜀 ${skipCount}명`);
        if (failCount > 0) parts.push(`실패 ${failCount}명`);

        return message + parts.join(', ');
    }

    /**
     * 멀티 역할 결과 메시지 생성
     */
    generateMultiRoleSummaryMessage(actionType, allResults, totalSuccessCount, totalSkipCount, totalFailCount) {
        const actionName = {
            'add_role': '추가',
            'remove_role': '제거',
            'toggle_role': '토글'
        }[actionType] || '처리';

        const successfulRoles = allResults.filter(r => r.successCount > 0).map(r => r.roleName);
        const failedRoles = allResults.filter(r => r.failCount > 0 && r.successCount === 0).map(r => r.roleName);

        let message = `역할 ${actionName} 완료:\n`;
        
        if (successfulRoles.length > 0) {
            message += `✅ 성공한 역할: ${successfulRoles.join(', ')} (총 ${totalSuccessCount}명)\n`;
        }
        
        if (failedRoles.length > 0) {
            message += `❌ 실패한 역할: ${failedRoles.join(', ')} (총 ${totalFailCount}명)\n`;
        }
        
        if (totalSkipCount > 0) {
            message += `⏭️ 건너뜀: ${totalSkipCount}명\n`;
        }

        return message.trim();
    }

    /**
     * 역할 액션 롤백
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
        const { roleId } = action.parameters;
        const { results } = executionResult.data;

        if (!results || results.length === 0) {
            return {
                success: true,
                message: '롤백할 작업이 없습니다.',
                rollbackCount: 0
            };
        }

        const targetRole = await this.safeDiscordApiCall(
            () => guild.roles.fetch(roleId),
            '롤백용 역할 조회'
        );

        if (!targetRole) {
            return {
                success: false,
                message: `롤백용 역할을 찾을 수 없습니다: ${roleId}`
            };
        }

        let rollbackCount = 0;
        const rollbackResults = [];

        for (const result of results) {
            if (!result.success || result.skipped) continue;

            try {
                const member = await guild.members.fetch(result.memberId);
                
                // 이전 상태로 복원
                if (result.previousState && !result.newState) {
                    // 원래 있던 역할을 다시 추가
                    await member.roles.add(targetRole, 'ButtonAutomation: rollback');
                    rollbackCount++;
                } else if (!result.previousState && result.newState) {
                    // 원래 없던 역할을 다시 제거
                    await member.roles.remove(targetRole, 'ButtonAutomation: rollback');
                    rollbackCount++;
                }

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
            message: `${rollbackCount}건의 역할 변경을 롤백했습니다.`,
            rollbackCount,
            rollbackResults
        };
    }
}

module.exports = { RoleActionExecutor };