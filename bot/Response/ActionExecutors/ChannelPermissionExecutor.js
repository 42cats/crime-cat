const { BaseActionExecutor } = require('./BaseActionExecutor');
const { PermissionsBitField } = require('discord.js');

/**
 * 채널 권한 관리 액션 실행기
 * set_channel_permission, remove_channel_permission, 
 * override_channel_permission, reset_channel_permission 액션 처리
 */
class ChannelPermissionExecutor extends BaseActionExecutor {
    static name = 'channel_permission';
    
    constructor(type) {
        super(type);
        this.requiredPermissions = ['ManageChannels', 'ManageRoles'];
        this.supportedTargets = ['executor', 'specific', 'role', 'all', 'admin'];
        this.retryable = true;
        this.rollbackable = true;
    }

    /**
     * 채널 권한 액션 실행
     */
    async performAction(action, context) {
        const { channelId, permissions } = action.parameters;
        const { ChannelType } = require('discord.js');

        if (!channelId) {
            throw new Error('대상 채널이 지정되지 않았습니다.');
        }

        if (!permissions || permissions.length === 0) {
            throw new Error('설정할 권한이 지정되지 않았습니다.');
        }

        // 여러 채널 지원
        const channelIds = Array.isArray(channelId) ? channelId : [channelId];
        const validatedChannels = [];
        const skippedChannels = [];

        // 각 채널 ID에 대해 사전 검증
        console.log(`🔍 [채널권한] ${channelIds.length}개 채널 검증 시작`);
        
        for (const chId of channelIds) {
            try {
                const channel = await context.guild.channels.fetch(chId);
                
                if (!channel) {
                    console.log(`⚠️ [채널권한] 채널을 찾을 수 없음: ${chId}`);
                    skippedChannels.push({ id: chId, reason: 'not_found' });
                    continue;
                }
                
                const isCategory = channel.type === ChannelType.GuildCategory;
                
                validatedChannels.push({
                    id: chId,
                    channel: channel,
                    type: channel.type,
                    isCategory: isCategory,
                    name: channel.name
                });
                
                console.log(`✅ [채널권한] 채널 확인됨: "${channel.name}" (타입: ${channel.type}, 카테고리: ${isCategory})`);
                
            } catch (error) {
                console.error(`❌ [채널권한] 채널 조회 실패 ${chId}: ${error.message}`);
                skippedChannels.push({ id: chId, reason: 'fetch_error', error: error.message });
            }
        }

        // 유효한 채널이 없으면 에러
        if (validatedChannels.length === 0) {
            console.log(`ℹ️ [채널권한] 처리할 수 있는 채널이 없음 (${skippedChannels.length}개 건너뜀)`);
            return this.formatResult(true, {
                requestedChannels: channelIds.length,
                validChannels: 0,
                skippedChannels: skippedChannels.length,
                skippedDetails: skippedChannels,
                summary: '처리할 수 있는 유효한 채널이 없습니다.'
            }, `처리할 수 있는 유효한 채널이 없어 건너뛰었습니다. (요청: ${channelIds.length}개, 건너뜀: ${skippedChannels.length}개)`);
        }

        console.log(`📊 [채널권한] 검증 결과: 유효 ${validatedChannels.length}개, 건너뜀 ${skippedChannels.length}개`);

        // 대상 해석 (역할 또는 멤버)
        const targets = await this.resolvePermissionTargets(action, context);
        const results = [];

        // 검증된 채널들에 대해서만 처리
        for (const channelInfo of validatedChannels) {
            const channelResult = await this.processChannelPermissions(
                action, context, channelInfo, targets, permissions
            );
            results.push(channelResult);
        }

        // 실행 결과 요약
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        const totalPermissionChanges = results.reduce((sum, r) => sum + (r.permissionChanges || 0), 0);
        
        // 카테고리로 인해 처리된 총 채널 수 계산
        const totalProcessedChannels = results.reduce((sum, r) => sum + (r.processedChannels || 1), 0);
        const categoryCount = results.filter(r => r.isCategory).length;

        // 성공 조건: 실패가 없거나, 성공이나 건너뛰기가 있으면 성공
        const isSuccess = failCount === 0 || successCount > 0;
        
        return this.formatResult(
            isSuccess,
            {
                actionType: action.type,
                channelCount: channelIds.length,
                validatedChannelCount: validatedChannels.length,
                skippedChannelCount: skippedChannels.length,
                skippedChannels,
                processedChannelCount: totalProcessedChannels,
                categoryCount,
                targetCount: targets.length,
                successCount,
                failCount,
                totalPermissionChanges,
                results
            },
            this.generateSummaryMessage(action.type, successCount, failCount, totalPermissionChanges, totalProcessedChannels, categoryCount, skippedChannels.length),
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
                    } else {
                        console.log(`⚠️ [채널권한] 역할을 찾을 수 없음: ${roleId}`);
                    }
                }
                
                // 유효한 역할이 없는 경우 처리
                if (targets.length === 0) {
                    console.log(`ℹ️ [채널권한] 유효한 대상 역할이 없어 건너뜀`);
                    return [];
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
     * 개별 채널의 권한 처리 (검증된 채널 정보 사용)
     */
    async processChannelPermissions(action, context, channelInfo, targets, permissions) {
        const { ChannelType } = require('discord.js');
        
        try {
            const { channel: targetChannel, isCategory, name, type } = channelInfo;
            
            console.log(`🔍 [채널권한] 처리 시작: "${name}" (타입: ${type}, 카테고리: ${isCategory})`);

            // 처리할 채널 목록 초기화
            let channelsToProcess = [];

            // 카테고리 채널인 경우 하위 채널들도 포함
            if (isCategory) {
                console.log(`📁 [채널권한] 카테고리 "${name}" - 하위 채널 자동 포함`);
                
                // parentId로 하위 채널 조회 (더 확실한 방법)
                const allChannels = await context.guild.channels.fetch();
                const childChannels = allChannels.filter(ch => 
                    ch.parentId === targetChannel.id && 
                    [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildStageVoice].includes(ch.type)
                );
                
                channelsToProcess = Array.from(childChannels.values());
                
                if (channelsToProcess.length > 0) {
                    console.log(`  └─ 하위 채널 ${channelsToProcess.length}개 발견: ${channelsToProcess.map(ch => `${ch.name}(${this.getChannelTypeName(ch.type)})`).join(', ')}`);
                } else {
                    console.log(`  ⚠️ 하위 채널이 없습니다.`);
                }
                
                // 카테고리 자체에도 권한을 설정해야 하는 경우 포함
                if (this.validateChannelPermissions(targetChannel, permissions).length > 0) {
                    channelsToProcess.unshift(targetChannel); // 카테고리를 맨 앞에 추가
                    console.log(`  └─ 카테고리 자체에도 권한 적용`);
                }
                
                // 하위 채널도 없고 카테고리에 적용할 권한도 없으면
                if (channelsToProcess.length === 0) {
                    console.log(`  ⚠️ 처리할 채널이 없습니다. 건너뜀`);
                    return {
                        success: false,
                        channelId: targetChannel.id,
                        channelName: name,
                        channelType: type,
                        isCategory: true,
                        message: '카테고리에 적용할 수 있는 권한이 없고 하위 채널도 없습니다.',
                        permissionChanges: 0
                    };
                }
            } else {
                // 일반 채널인 경우 해당 채널만 처리
                channelsToProcess = [targetChannel];
            }

            // 각 채널에 대해 권한 처리
            const allResults = [];
            let totalPermissionChanges = 0;

            for (const channel of channelsToProcess) {
                // 채널 타입별 권한 검증
                console.log(`  🔍 [권한검증] 입력된 권한들: ${permissions.join(', ')}`);
                const validPermissions = this.validateChannelPermissions(channel, permissions);
                console.log(`  📝 [권한검증] 유효한 권한들: ${validPermissions.join(', ')}`);
                
                if (validPermissions.length === 0) {
                    allResults.push({
                        success: false,
                        channelId: channel.id,
                        channelName: channel.name,
                        channelType: channel.type,
                        message: '해당 채널 타입에 적용할 수 있는 권한이 없습니다.',
                        permissionChanges: 0
                    });
                    continue;
                }

                const permissionResults = [];
                let channelPermissionChanges = 0;

                // 각 대상(역할/멤버)에 대해 권한 설정
                for (const target of targets) {
                    const result = await this.setChannelPermissionForTarget(
                        action.type, channel, target, validPermissions
                    );
                    permissionResults.push(result);
                    if (result.success) channelPermissionChanges++;
                }

                const successfulTargets = permissionResults.filter(r => r.success).length;
                totalPermissionChanges += channelPermissionChanges;

                allResults.push({
                    success: successfulTargets > 0,
                    channelId: channel.id,
                    channelName: channel.name,
                    channelType: channel.type,
                    isChild: channel.id !== targetChannel.id,
                    targetResults: permissionResults,
                    permissionChanges: channelPermissionChanges,
                    message: `${channel.name}: ${successfulTargets}/${targets.length} 대상 처리 완료`
                });
            }

            // 전체 결과 요약
            const successChannels = allResults.filter(r => r.success).length;
            const failChannels = allResults.filter(r => !r.success).length;

            let summaryMessage = targetChannel.type === 4 
                ? `📁 카테고리 "${targetChannel.name}" 및 하위 ${channelsToProcess.length - 1}개 채널: `
                : `채널 "${targetChannel.name}": `;
            
            summaryMessage += `성공 ${successChannels}/${channelsToProcess.length}개 채널 (총 ${totalPermissionChanges}건 변경)`;

            return {
                success: successChannels > 0,
                channelId: targetChannel.id,
                channelName: name,
                channelType: type,
                isCategory: isCategory,
                processedChannels: channelsToProcess.length,
                channelResults: allResults,
                permissionChanges: totalPermissionChanges,
                message: summaryMessage
            };

        } catch (error) {
            return {
                success: false,
                channelId: channelInfo.id,
                channelName: channelInfo.name,
                channelType: channelInfo.type,
                error: error.message,
                message: `채널 권한 설정 실패: ${error.message}`,
                permissionChanges: 0
            };
        }
    }

    /**
     * 채널 타입 이름 반환
     */
    getChannelTypeName(type) {
        const types = {
            0: '텍스트',
            2: '음성',
            4: '카테고리',
            5: '공지',
            13: '스테이지',
            15: '포럼'
        };
        return types[type] || '알 수 없음';
    }

    /**
     * 채널 타입별 권한 검증
     */
    validateChannelPermissions(channel, permissions) {
        const channelTypePermissions = {
            // 텍스트 채널 (0)
            0: [
                'ViewChannel', 'ManageChannels', 'ManageRoles', 'ManageWebhooks',
                'CreateInstantInvite', 'SendMessages', 'EmbedLinks', 'AttachFiles',
                'AddReactions', 'UseExternalEmojis', 'UseExternalStickers',
                'MentionEveryone', 'ManageMessages', 'ReadMessageHistory',
                'SendTTSMessages', 'UseApplicationCommands', 'SendMessagesInThreads',
                'CreatePublicThreads', 'CreatePrivateThreads', 'UseEmbeddedActivities'
            ],
            // 음성 채널 (2)
            2: [
                'ViewChannel', 'ManageChannels', 'ManageRoles',
                'CreateInstantInvite', 'Connect', 'Speak', 'Stream',
                'UseVAD', 'PrioritySpeaker', 'MuteMembers', 'DeafenMembers',
                'MoveMembers', 'UseEmbeddedActivities', 'UseSoundboard',
                'UseExternalSounds'
            ],
            // 카테고리 (4)
            4: [
                'ViewChannel', 'ManageChannels', 'ManageRoles',
                'CreateInstantInvite'
            ],
            // 공지 채널 (5)
            5: [
                'ViewChannel', 'ManageChannels', 'ManageRoles', 'ManageWebhooks',
                'CreateInstantInvite', 'SendMessages', 'EmbedLinks', 'AttachFiles',
                'AddReactions', 'UseExternalEmojis', 'MentionEveryone',
                'ManageMessages', 'ReadMessageHistory', 'UseApplicationCommands'
            ],
            // 스테이지 채널 (13)
            13: [
                'ViewChannel', 'ManageChannels', 'ManageRoles',
                'CreateInstantInvite', 'Connect', 'MuteMembers', 'MoveMembers',
                'RequestToSpeak', 'ManageEvents'
            ],
            // 포럼 채널 (15)
            15: [
                'ViewChannel', 'ManageChannels', 'ManageRoles',
                'CreateInstantInvite', 'SendMessages', 'EmbedLinks', 'AttachFiles',
                'AddReactions', 'UseExternalEmojis', 'MentionEveryone',
                'ManageMessages', 'ManageThreads', 'ReadMessageHistory',
                'UseApplicationCommands', 'CreatePublicThreads'
            ]
        };

        const allowedPermissions = channelTypePermissions[channel.type] || channelTypePermissions[0];
        return permissions.filter(permission => allowedPermissions.includes(permission));
    }

    /**
     * 특정 대상(역할/멤버)에 대한 채널 권한 설정 (/부여 명령어 방식 사용)
     */
    async setChannelPermissionForTarget(actionType, channel, target, permissions) {
        try {
            const { type: targetType, target: targetEntity } = target;
            
            console.log(`\n🎯 [권한설정] "${channel.name}"에 "${targetEntity.name || targetEntity.displayName}" ${targetType} 권한 설정 시작`);
            console.log(`  └─ 적용할 권한: ${permissions.join(', ')}`);
            
            // 현재 권한 상태 저장 (롤백용)
            const currentOverwrite = channel.permissionOverwrites.cache.get(targetEntity.id);
            const previousPermissions = {
                allow: currentOverwrite?.allow?.bitfield || 0n,
                deny: currentOverwrite?.deny?.bitfield || 0n
            };
            
            console.log(`  └─ 적용 전 권한:`, {
                exists: !!currentOverwrite,
                allow: currentOverwrite?.allow?.toArray() || [],
                deny: currentOverwrite?.deny?.toArray() || []
            });

            // Discord.js v14 안정적인 권한 설정 방식 사용
            console.log(`  └─ Discord.js v14 개선된 권한 설정 방식 사용...`);
            
            // reset_channel_permission 액션 처리
            if (actionType === 'reset_channel_permission') {
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
            }

            // 방법 1: 간단한 속성 방식 우선 사용 (조언 4번 - 가장 안전한 방법)
            console.log(`  └─ 속성 방식 우선 시도 (권장 방법)...`);
            
            try {
                const permissionObject = {};
                
                // 기존 권한 가져오기 (override가 아닌 경우만)
                if (actionType !== 'override_channel_permission' && currentOverwrite) {
                    const allowArray = currentOverwrite.allow.toArray();
                    allowArray.forEach(permission => {
                        permissionObject[permission] = true;
                    });
                    
                    const denyArray = currentOverwrite.deny.toArray();
                    denyArray.forEach(permission => {
                        permissionObject[permission] = false;
                    });
                }
                
                // 새 권한 적용
                permissions.forEach(permission => {
                    switch (actionType) {
                        case 'set_channel_permission':
                            permissionObject[permission] = true;
                            console.log(`    + ${permission}: true`);
                            break;
                        case 'remove_channel_permission':
                            permissionObject[permission] = false;
                            console.log(`    - ${permission}: false`);
                            break;
                        case 'override_channel_permission':
                            permissionObject[permission] = true;
                            console.log(`    = ${permission}: true`);
                            break;
                    }
                });
                
                console.log(`  └─ 최종 권한 객체:`, permissionObject);
                
                // 속성 방식으로 권한 설정 (type 필드 제거 - 조언 3번)
                await this.safeDiscordApiCall(
                    () => channel.permissionOverwrites.edit(
                        targetEntity.id,
                        permissionObject,
                        `ButtonAutomation: ${actionType}`
                    ),
                    '채널 권한 설정 (속성 방식)'
                );
                
                // 적용 후 권한 상태 확인
                const updatedOverwrite = channel.permissionOverwrites.cache.get(targetEntity.id);
                console.log(`  ✅ 적용 후 권한:`, {
                    exists: !!updatedOverwrite,
                    allow: updatedOverwrite?.allow?.toArray() || [],
                    deny: updatedOverwrite?.deny?.toArray() || []
                });

                console.log(`  🎉 [권한설정] "${targetEntity.name || targetEntity.displayName}" ${targetType} 권한 설정 완료! (속성 방식)\n`);

                return {
                    success: true,
                    targetType,
                    targetId: targetEntity.id,
                    targetName: targetEntity.name || targetEntity.displayName,
                    message: `권한을 ${this.getActionName(actionType)}했습니다. (속성 방식)`,
                    previousPermissions,
                    newPermissions: permissionObject,
                    appliedPermissions: permissions,
                    action: actionType
                };
                
            } catch (error) {
                console.error(`  ❌ 속성 방식 실패: ${error.message}`);
                console.log(`  └─ 방법 2: PermissionsBitField.resolve() 대체 시도... (조언 1번)`);
                
                // 방법 2: PermissionsBitField.resolve() 사용 (조언 1번)
                let permissionBits;
                try {
                    const resolvedBits = PermissionsBitField.resolve(permissions);
                    permissionBits = typeof resolvedBits === 'bigint' ? resolvedBits : BigInt(resolvedBits);
                    console.log(`  └─ 입력 권한: ${permissions.join(', ')}`);
                    console.log(`  └─ 최종 권한 비트: ${permissionBits.toString()}`);
                    
                    // 비트가 0이면 실패
                    if (permissionBits === 0n) {
                        throw new Error('권한 비트가 0입니다.');
                    }
                } catch (resolveError) {
                    console.error(`  ❌ 권한 비트 계산도 실패: ${resolveError.message}`);
                    throw new Error(`모든 권한 설정 방식 실패: ${error.message}, ${resolveError.message}`);
                }
                
                // 비트 방식으로 권한 계산
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

                    default:
                        throw new Error(`지원하지 않는 권한 액션: ${actionType}`);
                }

                console.log(`  └─ 최종 권한 비트 - Allow: ${newAllow.toString()}, Deny: ${newDeny.toString()}`);

                // 비트 방식으로 권한 설정 (type 필드 제거 - 조언 3번)
                await this.safeDiscordApiCall(
                    () => channel.permissionOverwrites.edit(
                        targetEntity.id,
                        { allow: newAllow, deny: newDeny },
                        `ButtonAutomation: ${actionType}`
                    ),
                    '채널 권한 설정 (비트 방식)'
                );

                // 적용 후 권한 상태 확인
                const updatedOverwrite = channel.permissionOverwrites.cache.get(targetEntity.id);
                console.log(`  ✅ 적용 후 권한:`, {
                    exists: !!updatedOverwrite,
                    allow: updatedOverwrite?.allow?.toArray() || [],
                    deny: updatedOverwrite?.deny?.toArray() || []
                });

                console.log(`  🎉 [권한설정] "${targetEntity.name || targetEntity.displayName}" ${targetType} 권한 설정 완료! (비트 방식)\n`);

                return {
                    success: true,
                    targetType,
                    targetId: targetEntity.id,
                    targetName: targetEntity.name || targetEntity.displayName,
                    message: `권한을 ${this.getActionName(actionType)}했습니다. (비트 방식)`,
                    previousPermissions,
                    newPermissions: { allow: newAllow, deny: newDeny },
                    appliedPermissions: permissions,
                    action: actionType
                };
            }

        } catch (error) {
            console.error(`  ❌ [권한설정] 권한 설정 실패: ${error.message}\n`);
            
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
    generateSummaryMessage(actionType, successCount, failCount, totalChanges, totalProcessed, categoryCount, skippedCount = 0) {
        const actionName = this.getActionName(actionType);
        
        let message = `채널 권한 ${actionName}: `;
        
        // 카테고리가 포함된 경우 특별한 메시지
        if (categoryCount > 0 && totalProcessed > successCount + failCount) {
            message += `${categoryCount}개 카테고리 및 하위 채널 포함 - `;
        }
        
        const parts = [];
        if (successCount > 0) parts.push(`성공 ${successCount}개`);
        if (failCount > 0) parts.push(`실패 ${failCount}개`);
        if (skippedCount > 0) parts.push(`건너뜀 ${skippedCount}개`);
        
        message += parts.join(', ');
        
        if (totalChanges > 0) {
            message += ` (총 ${totalProcessed}개 채널에서 ${totalChanges}건 변경)`;
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
                        // /부여 명령어 방식으로 이전 권한 상태 복원
                        if (targetResult.action === 'reset') {
                            // 리셋한 경우 이전 권한 복원
                            if (targetResult.previousPermissions.allow !== 0n || targetResult.previousPermissions.deny !== 0n) {
                                // 이전 권한을 객체 형태로 변환
                                const previousPermissionObj = {};
                                
                                // allow 권한들을 true로 설정
                                const allowFlags = new PermissionsBitField(targetResult.previousPermissions.allow).toArray();
                                allowFlags.forEach(permission => {
                                    previousPermissionObj[permission] = true;
                                });
                                
                                // deny 권한들을 false로 설정
                                const denyFlags = new PermissionsBitField(targetResult.previousPermissions.deny).toArray();
                                denyFlags.forEach(permission => {
                                    previousPermissionObj[permission] = false;
                                });
                                
                                const targetEntity = targetResult.targetType === 'role' 
                                    ? await guild.roles.fetch(targetResult.targetId)
                                    : await guild.members.fetch(targetResult.targetId);
                                
                                await channel.permissionOverwrites.edit(
                                    targetEntity,
                                    previousPermissionObj,
                                    'ButtonAutomation: rollback'
                                );
                            }
                        } else {
                            // 기타 액션의 경우 이전 상태로 복원
                            const previousPermissionObj = {};
                            
                            // allow 권한들을 true로 설정
                            const allowFlags = new PermissionsBitField(targetResult.previousPermissions.allow).toArray();
                            allowFlags.forEach(permission => {
                                previousPermissionObj[permission] = true;
                            });
                            
                            // deny 권한들을 false로 설정
                            const denyFlags = new PermissionsBitField(targetResult.previousPermissions.deny).toArray();
                            denyFlags.forEach(permission => {
                                previousPermissionObj[permission] = false;
                            });
                            
                            const targetEntity = targetResult.targetType === 'role' 
                                ? await guild.roles.fetch(targetResult.targetId)
                                : await guild.members.fetch(targetResult.targetId);
                            
                            await channel.permissionOverwrites.edit(
                                targetEntity,
                                previousPermissionObj,
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