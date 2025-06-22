const { BaseActionExecutor } = require('./BaseActionExecutor');
const { PermissionsBitField } = require('discord.js');

/**
 * 채널 권한 관리 액션 실행기
 * set_channel_permission, remove_channel_permission, 
 * override_channel_permission, reset_channel_permission 액션 처리
 */
class ChannelPermissionExecutor extends BaseActionExecutor {
    constructor(type) {
        super(type);
        this.requiredPermissions = ['MANAGE_CHANNELS', 'MANAGE_PERMISSIONS'];
        this.supportedTargets = ['executor', 'specific', 'role', 'all', 'admin'];
        this.retryable = true;
        this.rollbackable = true;
    }

    /**
     * 채널 권한 액션 실행
     */
    async performAction(action, context) {
        const { channelId, permissions } = action.parameters;

        if (!channelId) {
            throw new Error('대상 채널이 지정되지 않았습니다.');
        }

        if (!permissions || permissions.length === 0) {
            throw new Error('설정할 권한이 지정되지 않았습니다.');
        }

        // 여러 채널 지원
        const channelIds = Array.isArray(channelId) ? channelId : [channelId];
        const results = [];

        // 대상 해석 (역할 또는 멤버)
        const targets = await this.resolvePermissionTargets(action, context);

        for (const chId of channelIds) {
            const channelResult = await this.processChannelPermissions(
                action, context, chId, targets, permissions
            );
            results.push(channelResult);
        }

        // 실행 결과 요약
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        const totalPermissionChanges = results.reduce((sum, r) => sum + (r.permissionChanges || 0), 0);

        return this.formatResult(
            successCount > 0,
            {
                actionType: action.type,
                channelCount: channelIds.length,
                targetCount: targets.length,
                successCount,
                failCount,
                totalPermissionChanges,
                results
            },
            this.generateSummaryMessage(action.type, successCount, failCount, totalPermissionChanges),
            successCount === 0 ? new Error('모든 채널에서 권한 설정이 실패했습니다.') : null
        );
    }

    /**
     * 권한 대상 해석 (역할 또는 멤버)
     */
    async resolvePermissionTargets(action, context) {
        const targets = [];

        switch (action.target) {
            case 'executor':
                targets.push({ type: 'member', target: context.member });
                break;

            case 'specific':
                if (!action.parameters.targetUserId) {
                    throw new Error('특정 사용자 ID가 지정되지 않았습니다.');
                }
                const targetMember = await context.guild.members.fetch(action.parameters.targetUserId);
                targets.push({ type: 'member', target: targetMember });
                break;

            case 'role':
                const targetRoleIds = action.parameters.targetRoleIds || 
                                    (action.parameters.targetRoleId ? [action.parameters.targetRoleId] : []);
                
                if (targetRoleIds.length === 0) {
                    throw new Error('대상 역할이 지정되지 않았습니다.');
                }

                for (const roleId of targetRoleIds) {
                    const targetRole = await context.guild.roles.fetch(roleId);
                    if (targetRole) {
                        targets.push({ type: 'role', target: targetRole });
                    }
                }
                break;

            case 'all':
                // @everyone 역할 대상
                const everyoneRole = context.guild.roles.everyone;
                targets.push({ type: 'role', target: everyoneRole });
                break;

            default:
                throw new Error(`지원하지 않는 대상 타입: ${action.target}`);
        }

        return targets;
    }

    /**
     * 개별 채널의 권한 처리
     */
    async processChannelPermissions(action, context, channelId, targets, permissions) {
        try {
            // 대상 채널 조회
            const targetChannel = await this.safeDiscordApiCall(
                () => context.guild.channels.fetch(channelId),
                '대상 채널 조회'
            );

            if (!targetChannel) {
                throw new Error(`채널을 찾을 수 없습니다: ${channelId}`);
            }

            // 채널 타입별 권한 검증
            const validPermissions = this.validateChannelPermissions(targetChannel, permissions);
            if (validPermissions.length === 0) {
                return {
                    success: false,
                    channelId,
                    channelName: targetChannel.name,
                    message: '해당 채널 타입에 적용할 수 있는 권한이 없습니다.',
                    permissionChanges: 0
                };
            }

            const permissionResults = [];
            let permissionChanges = 0;

            // 각 대상(역할/멤버)에 대해 권한 설정
            for (const target of targets) {
                const result = await this.setChannelPermissionForTarget(
                    action.type, targetChannel, target, validPermissions
                );
                permissionResults.push(result);
                if (result.success) permissionChanges++;
            }

            const successfulTargets = permissionResults.filter(r => r.success).length;

            return {
                success: successfulTargets > 0,
                channelId,
                channelName: targetChannel.name,
                channelType: targetChannel.type,
                targetResults: permissionResults,
                permissionChanges,
                message: `${targetChannel.name}: ${successfulTargets}/${targets.length} 대상 처리 완료`
            };

        } catch (error) {
            return {
                success: false,
                channelId,
                error: error.message,
                message: `채널 권한 설정 실패: ${error.message}`,
                permissionChanges: 0
            };
        }
    }

    /**
     * 채널 타입별 권한 검증
     */
    validateChannelPermissions(channel, permissions) {
        const channelTypePermissions = {
            // 텍스트 채널 (0)
            0: [
                'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_PERMISSIONS', 'MANAGE_WEBHOOKS',
                'CREATE_INSTANT_INVITE', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES',
                'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'USE_EXTERNAL_STICKERS',
                'MENTION_EVERYONE', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY',
                'SEND_TTS_MESSAGES', 'USE_APPLICATION_COMMANDS', 'SEND_MESSAGES_IN_THREADS',
                'CREATE_PUBLIC_THREADS', 'CREATE_PRIVATE_THREADS', 'USE_EMBEDDED_ACTIVITIES'
            ],
            // 음성 채널 (2)
            2: [
                'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_PERMISSIONS',
                'CREATE_INSTANT_INVITE', 'CONNECT', 'SPEAK', 'STREAM',
                'USE_VAD', 'PRIORITY_SPEAKER', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS',
                'MOVE_MEMBERS', 'USE_EMBEDDED_ACTIVITIES', 'USE_SOUNDBOARD',
                'USE_EXTERNAL_SOUNDS'
            ],
            // 카테고리 (4)
            4: [
                'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_PERMISSIONS',
                'CREATE_INSTANT_INVITE'
            ],
            // 공지 채널 (5)
            5: [
                'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_PERMISSIONS', 'MANAGE_WEBHOOKS',
                'CREATE_INSTANT_INVITE', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES',
                'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE',
                'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY', 'USE_APPLICATION_COMMANDS'
            ],
            // 스테이지 채널 (13)
            13: [
                'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_PERMISSIONS',
                'CREATE_INSTANT_INVITE', 'CONNECT', 'MUTE_MEMBERS', 'MOVE_MEMBERS',
                'REQUEST_TO_SPEAK', 'MANAGE_EVENTS'
            ],
            // 포럼 채널 (15)
            15: [
                'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_PERMISSIONS',
                'CREATE_INSTANT_INVITE', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES',
                'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE',
                'MANAGE_MESSAGES', 'MANAGE_THREADS', 'READ_MESSAGE_HISTORY',
                'USE_APPLICATION_COMMANDS', 'CREATE_PUBLIC_THREADS'
            ]
        };

        const allowedPermissions = channelTypePermissions[channel.type] || channelTypePermissions[0];
        return permissions.filter(permission => allowedPermissions.includes(permission));
    }

    /**
     * 특정 대상(역할/멤버)에 대한 채널 권한 설정
     */
    async setChannelPermissionForTarget(actionType, channel, target, permissions) {
        try {
            const { type: targetType, target: targetEntity } = target;
            
            // 현재 권한 상태 저장 (롤백용)
            const currentOverwrite = channel.permissionOverwrites.cache.get(targetEntity.id);
            const previousPermissions = {
                allow: currentOverwrite?.allow?.bitfield || 0n,
                deny: currentOverwrite?.deny?.bitfield || 0n
            };

            // 권한 비트 계산
            const permissionBits = permissions.reduce((bits, permission) => {
                if (PermissionsBitField.Flags[permission]) {
                    return bits | PermissionsBitField.Flags[permission];
                }
                return bits;
            }, 0n);

            let newAllow = 0n;
            let newDeny = 0n;

            switch (actionType) {
                case 'set_channel_permission':
                    // 기존 권한 유지하며 새 권한 추가
                    newAllow = (currentOverwrite?.allow?.bitfield || 0n) | permissionBits;
                    newDeny = (currentOverwrite?.deny?.bitfield || 0n) & ~permissionBits;
                    break;

                case 'remove_channel_permission':
                    // 특정 권한 제거
                    newAllow = (currentOverwrite?.allow?.bitfield || 0n) & ~permissionBits;
                    newDeny = (currentOverwrite?.deny?.bitfield || 0n) | permissionBits;
                    break;

                case 'override_channel_permission':
                    // 기존 권한 덮어쓰기
                    newAllow = permissionBits;
                    newDeny = 0n;
                    break;

                case 'reset_channel_permission':
                    // 권한 초기화 (삭제)
                    if (currentOverwrite) {
                        await this.safeDiscordApiCall(
                            () => currentOverwrite.delete('ButtonAutomation: reset_channel_permission'),
                            '채널 권한 초기화'
                        );
                        
                        return {
                            success: true,
                            targetType,
                            targetId: targetEntity.id,
                            targetName: targetEntity.name || targetEntity.displayName,
                            message: '권한을 초기화했습니다.',
                            previousPermissions,
                            action: 'reset'
                        };
                    } else {
                        return {
                            success: true,
                            targetType,
                            targetId: targetEntity.id,
                            targetName: targetEntity.name || targetEntity.displayName,
                            message: '이미 기본 권한 상태입니다.',
                            previousPermissions,
                            action: 'no_change'
                        };
                    }

                default:
                    throw new Error(`지원하지 않는 권한 액션: ${actionType}`);
            }

            // 권한 덮어쓰기 적용
            const overwriteOptions = {
                allow: newAllow,
                deny: newDeny,
                type: targetType === 'role' ? 0 : 1 // 0: 역할, 1: 멤버
            };

            await this.safeDiscordApiCall(
                () => channel.permissionOverwrites.edit(
                    targetEntity.id, 
                    overwriteOptions,
                    `ButtonAutomation: ${actionType}`
                ),
                '채널 권한 설정'
            );

            return {
                success: true,
                targetType,
                targetId: targetEntity.id,
                targetName: targetEntity.name || targetEntity.displayName,
                message: `권한을 ${this.getActionName(actionType)}했습니다.`,
                previousPermissions,
                newPermissions: { allow: newAllow, deny: newDeny },
                appliedPermissions: permissions,
                action: actionType
            };

        } catch (error) {
            return {
                success: false,
                targetType: target.type,
                targetId: target.target.id,
                targetName: target.target.name || target.target.displayName,
                message: `권한 설정 실패: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * 액션 이름 반환
     */
    getActionName(actionType) {
        const names = {
            'set_channel_permission': '설정',
            'remove_channel_permission': '제거',
            'override_channel_permission': '덮어쓰기',
            'reset_channel_permission': '초기화'
        };
        return names[actionType] || '처리';
    }

    /**
     * 결과 메시지 생성
     */
    generateSummaryMessage(actionType, successCount, failCount, totalChanges) {
        const actionName = this.getActionName(actionType);
        
        let message = `채널 권한 ${actionName}: `;
        
        const parts = [];
        if (successCount > 0) parts.push(`성공 ${successCount}개 채널`);
        if (failCount > 0) parts.push(`실패 ${failCount}개 채널`);
        
        message += parts.join(', ');
        
        if (totalChanges > 0) {
            message += ` (총 ${totalChanges}건 변경)`;
        }

        return message;
    }

    /**
     * 채널 권한 액션 롤백
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

        for (const channelResult of results) {
            if (!channelResult.success || !channelResult.targetResults) continue;

            try {
                const channel = await guild.channels.fetch(channelResult.channelId);
                if (!channel) continue;

                for (const targetResult of channelResult.targetResults) {
                    if (!targetResult.success) continue;

                    try {
                        // 이전 권한 상태로 복원
                        if (targetResult.action === 'reset') {
                            // 리셋한 경우 이전 권한 복원
                            if (targetResult.previousPermissions.allow !== 0n || targetResult.previousPermissions.deny !== 0n) {
                                await channel.permissionOverwrites.edit(
                                    targetResult.targetId,
                                    {
                                        allow: targetResult.previousPermissions.allow,
                                        deny: targetResult.previousPermissions.deny,
                                        type: targetResult.targetType === 'role' ? 0 : 1
                                    },
                                    'ButtonAutomation: rollback'
                                );
                            }
                        } else {
                            // 기타 액션의 경우 이전 상태로 복원
                            await channel.permissionOverwrites.edit(
                                targetResult.targetId,
                                {
                                    allow: targetResult.previousPermissions.allow,
                                    deny: targetResult.previousPermissions.deny,
                                    type: targetResult.targetType === 'role' ? 0 : 1
                                },
                                'ButtonAutomation: rollback'
                            );
                        }

                        rollbackCount++;
                        rollbackResults.push({
                            channelId: channelResult.channelId,
                            targetId: targetResult.targetId,
                            success: true,
                            message: '성공적으로 롤백되었습니다.'
                        });

                    } catch (error) {
                        rollbackResults.push({
                            channelId: channelResult.channelId,
                            targetId: targetResult.targetId,
                            success: false,
                            message: `롤백 실패: ${error.message}`
                        });
                    }
                }

            } catch (error) {
                rollbackResults.push({
                    channelId: channelResult.channelId,
                    success: false,
                    message: `채널 롤백 실패: ${error.message}`
                });
            }
        }

        return {
            success: rollbackCount > 0,
            message: `${rollbackCount}건의 채널 권한 변경을 롤백했습니다.`,
            rollbackCount,
            rollbackResults
        };
    }
}

module.exports = { ChannelPermissionExecutor };