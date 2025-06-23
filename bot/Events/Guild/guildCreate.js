const logger = require('../../Commands/utility/logger');
const { guildAddProcess } = require('../../Commands/api/guild/guild');

module.exports = {
    name: 'guildCreate',
    once: false,
    async execute(guild) {
        try {
            // 캐시에서 대상 길드 가져오기
            const targetGuild = guild.client.guilds.cache.get(guild.id);
            if (!targetGuild) return;

            // 오너 정보 가져오기
            const owner = await guild.client.users.fetch(guild.ownerId);

            // 전송할 메시지 구성
            const payload = {
                type: 'NEW_GUILD_JOINED',
                guildId: guild.id,
                guildName: guild.name,
                memberCount: guild.memberCount,
                ownerId: guild.ownerId,
                ownerTag: owner?.tag ?? '알 수 없음',
                joinedAt: new Date().toISOString(),
            };

            logger.info('🎉 [이벤트] 새 길드 참가 감지', {
                guildId: guild.id,
                guildName: guild.name,
                memberCount: guild.memberCount,
                ownerId: guild.ownerId,
                ownerTag: owner?.tag
            });

            // 마스터에게 전송
            if (guild.client.master) {
                await guild.client.master.send(payload);
            }

            await guildAddProcess(guild.client, targetGuild);
            
            if (guild.client.master) {
                await guild.client.master.send('길드 추가 프로세스 완료');
            }

            logger.info('✅ [길드 처리] 새 길드 추가 프로세스 완료', {
                guildId: guild.id,
                guildName: guild.name
            });

        } catch (err) {
            logger.error('❌ [이벤트 처리 실패] guildCreate:', {
                error: err.message,
                stack: err.stack,
                guildId: guild.id,
                guildName: guild.name
            });
        }
    }
};