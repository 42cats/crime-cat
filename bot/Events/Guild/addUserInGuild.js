const { Guild } = require('discord.js');
const { addGuild, guildAddProcess } = require('../../Commands/api/guild/guild');
const { getUserHistory, addUserHistory } = require('../../Commands/api/history/history');
const addObserverPemission = require('../../Commands/utility/addObserverPemission');
const logger = require('../../Commands/utility/logger');
module.exports = {
    name: "guildMemberAdd",
    once: false,

    /**
     * 길드에 유저가 참여할 때 실행되는 이벤트
     * @param {import('discord.js').GuildMember} member
     */
    execute: async (member) => {
        try {
            const guildId = member.guild.id;
            const userId = member.user.id;

            logger.info('👥 [이벤트] 길드 멤버 추가 감지', {
                guildId,
                userId,
                username: member.user.username,
                guildName: member.guild.name
            });

            // 길드가 DB에 존재하는지 확인
            const guildData = await addGuild(member.guild);
            logger.debug('길드 데이터 확인', { guildData });
            if (!guildData || !guildData.data || !guildData.data.snowflake) {
                await guildAddProcess(member.client, member.guild);
            }
            const historyList = await getUserHistory(userId);
            const historyRecord = historyList.find(v => v.guildSnowflake === guildId);

            if (historyRecord) {
                logger.info('🔍 [기록 확인] 기존 참여 기록 발견 - 관전자 역할 부여', { userId, guildId });

                // 관전자 역할 부여 함수 실행
                try {
                    await addObserverPemission(member.client, guildId, userId);
                } catch (error) {
                    logger.error('❌ [관전자 역할 부여 실패]', { error: error.message, stack: error.stack, userId, guildId });
                }
            } else {
                logger.info('📝 [신규 멤버] 참여 기록 없음 - 히스토리 추가', { userId, guildId });
                await addUserHistory(member.user, member.guild, member.user.displayName ?? member.user.globalName, member.joinedAt);
            }
        } catch (error) {
            logger.error('❌ [이벤트 처리 실패] guildMemberAdd:', { error: error.message, stack: error.stack, userId: member.user.id, guildId: member.guild.id });
        }
    }
}