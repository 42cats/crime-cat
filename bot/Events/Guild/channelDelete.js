const { handleChannelEvent } = require('../../Commands/api/cache/cache');
const logger = require('../../Commands/utility/logger');

module.exports = {
    name: 'channelDelete',
    once: false,
    async execute(channel) {
        try {
            // 길드 채널만 처리 (DM 채널 제외)
            if (!channel.guild) {
                return;
            }

            const guildId = channel.guild.id;
            const channelInfo = {
                id: channel.id,
                name: channel.name,
                type: channel.type
            };

            logger.info('📺 [이벤트] 채널 삭제 감지', {
                guildId,
                channelId: channel.id,
                channelName: channel.name,
                channelType: channel.type
            });

            // 캐시 무효화 API 호출
            await handleChannelEvent(guildId, channelInfo, 'delete');

            logger.info('✅ [캐시 무효화] 채널 삭제로 인한 캐시 무효화 완료', {
                guildId,
                channelId: channel.id,
                channelName: channel.name
            });

        } catch (error) {
            logger.error('❌ [이벤트 처리 실패] channelDelete:', {
                error: error.message,
                stack: error.stack,
                channelId: channel.id,
                guildId: channel.guild?.id
            });
        }
    }
};