const logger = require('../../Commands/utility/logger');
const { deleteGuild } = require('../../Commands/api/guild/guild');

module.exports = {
    name: 'guildDelete',
    once: false,
    async execute(guild) {
        try {
            // 길드가 일시적으로 사용 불가능한지 확인 (Discord 서버 문제)
            if (!guild.available) {
                logger.warn('⚠️ [이벤트] 길드 일시적 사용 불가', {
                    guildId: guild.id,
                    guildName: guild.name
                });
                return;
            }

            // 실제 봇이 제거되거나 길드가 삭제된 경우
            logger.info('👋 [이벤트] 길드에서 제거됨', {
                guildId: guild.id,
                guildName: guild.name,
                memberCount: guild.memberCount || 0
            });

            // 마스터에게 알림 (guildCreate와 동일한 방식)
            if (guild.client.master) {
                const message = `👋 길드에서 제거됨: **${guild.name}** (ID: ${guild.id})\n멤버 수: ${guild.memberCount || 0}명`;
                await guild.client.master.send({ content: message });
            }

            // Backend API 호출 (길드 삭제)
            const result = await deleteGuild(guild.id);
            logger.info('✅ [길드 처리] 길드 삭제 프로세스 완료', {
                guildId: guild.id,
                guildName: guild.name,
                apiResult: result
            });

            // API 호출 성공 알림
            if (guild.client.master) {
                await guild.client.master.send({ content: '✅ 길드 삭제 프로세스 완료' });
            }

        } catch (err) {
            logger.error('❌ [이벤트 처리 실패] guildDelete:', {
                error: err.message,
                stack: err.stack,
                guildId: guild.id,
                guildName: guild.name
            });

            // 에러 발생 시 마스터에게 알림
            if (guild.client.master) {
                await guild.client.master.send({
                    content: `❌ 길드 삭제 처리 실패: ${guild.name} (${err.message})`
                });
            }
        }
    }
};