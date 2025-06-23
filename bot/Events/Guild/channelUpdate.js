const { handleChannelEvent } = require('../../Commands/api/cache/cache');
const logger = require('../../Commands/utility/logger');

module.exports = {
    name: 'channelUpdate',
    once: false,
    async execute(oldChannel, newChannel) {
        try {
            // 길드 채널만 처리 (DM 채널 제외)
            if (!newChannel.guild) {
                return;
            }

            const guildId = newChannel.guild.id;
            const channelInfo = {
                id: newChannel.id,
                name: newChannel.name,
                type: newChannel.type,
                oldName: oldChannel.name,
                changes: {
                    name: oldChannel.name !== newChannel.name,
                    type: oldChannel.type !== newChannel.type,
                    parent: oldChannel.parentId !== newChannel.parentId
                }
            };

            logger.info('📺 [이벤트] 채널 수정 감지', {
                guildId,
                channelId: newChannel.id,
                oldName: oldChannel.name,
                newName: newChannel.name,
                channelType: newChannel.type,
                changes: channelInfo.changes
            });

            // 캐시 무효화 API 호출
            await handleChannelEvent(guildId, channelInfo, 'update');

            logger.info('✅ [캐시 무효화] 채널 수정으로 인한 캐시 무효화 완료', {
                guildId,
                channelId: newChannel.id,
                channelName: newChannel.name
            });

        } catch (error) {
            logger.error('❌ [이벤트 처리 실패] channelUpdate:', {
                error: error.message,
                stack: error.stack,
                channelId: newChannel.id,
                guildId: newChannel.guild?.id
            });
        }
    }
};