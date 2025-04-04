const addObserverPermission = require('../../Commands/utility/addObserverPemission');
const { Guild} = require('discord.js');
const { addGuild, guildAddProcess } = require('../../Commands/api/guild/guild');
const { getUserHistory, addUserHistory } = require('../../Commands/api/history/history');
module.exports = {
    name: "GuildMemberAdd",

    /**
     * 길드에 유저가 참여할 때 실행되는 이벤트
     * @param {import('discord.js').GuildMember} member
     */
    execute: async (member) => {
        try {
            const guildId = member.guild.id;
            const userId = member.user.id;

            console.log(`[EVENT] ${member.user.username}(${userId}) 가 ${member.guild.name}(${guildId}) 길드에 참가했습니다.`);

            // 길드가 DB에 존재하는지 확인
            const guildData = await addGuild(member.guild);
            console.log("guildl data = ", guildData);
            if (!guildData || !guildData.data || !guildData.data.snowflake) {
                await guildAddProcess(member.client, member.guild);
            }
            const historyList = await getUserHistory(userId);
            const historyRecord = historyList.find(v => v.guildSnowflake === guildId);
            
            if (historyRecord) {
                console.log(`유저(${userId})의 기존 참여 기록이 존재합니다. 관전자 역할을 부여합니다.`);

                // 관전자 역할 부여 함수 실행
                try {
                    await addObserverPermission(member.client, guildId, userId);
                } catch (error) {
                    console.log(error.stack);
                }
            } else {
                console.log(`유저(${userId})의 참여 기록이 없습니다.`);
                await addUserHistory(member.user,member.guild,member.user.displayName ?? member.user.globalName);
            }
        } catch (error) {
            console.error(`[ERROR] guildMemberAdd 이벤트 처리 중 오류 발생:`, error);
        }
    }
}