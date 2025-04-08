const { Client } = require('discord.js');
const { getGuildObserverSet, addGuildObserverSet } = require('../api/guild/observer');

/**
 * 관전자 역할을 부여하고 닉네임을 변경하는 함수
 * 
 * @param {Client} client
 * @param {String} guildId 
 * @param  {...String} users 
 */
async function addObserverPemission(client, guildId, ...users) {
    try {
        if (users.length === 1 && Array.isArray(users[0])) {
            users = users[0]; // 배열이 중첩된 경우 한 단계 풀어줌
        }

        // 길드 정보 가져오기
        const guildData = await getGuildObserverSet(guildId);
        console.log("guild data = ", guildData);
        // head_title이 없으면 기본값 "-관전" 설정
        const head_title = guildData?.data?.headTitle ?? "-관전";
        const observer = guildData?.data?.roleSnowFlake ?? null;

        // 클라이언트에서 길드 가져오기
        const guild = await client.guilds.fetch(guildId);

        let role = null;

        // observer 역할 ID가 있는 경우만 역할 가져오기
        if (observer) {
            role = guild.roles.cache.get(observer) || await guild.roles.fetch(observer).catch(() => null);
            if (!role) {
                await addGuildObserverSet(guildId, head_title);
                console.warn(`⚠️ 관전 역할(${observer})을 찾을 수 없습니다.`);
            }
        }

        for (const userId of users) {
            try {
                // 유저 정보 가져오기
                const member = await guild.members.fetch(userId);
                if (!member) {
                    console.warn(`⚠️ 유저 ${userId}를 찾을 수 없습니다.`);
                    continue;
                }
                try {
                    if (role && !member.roles.cache.has(role.id)) {
                        console.log(`🟢 ${userId}에게 관전 역할을 부여 중...`);
                        await member.roles.add(role);
                    }
                } catch (error) {
                    console.error("add observer add role", error.stack);
                }
                // 역할 부여 (observer가 있을 경우에만 실행)

                // 기존 닉네임 앞에 head_title 추가 (최대 32자 제한)
                const newNickname = `${head_title} ${member.user.globalName}`.slice(0, 32);
                try {
                    await member.setNickname(newNickname);

                } catch (error) {
                    console.log("add observer set nick name ", error.stack);
                }

                console.log(`✅ 유저 ${userId}에게 닉네임 변경 완료: ${newNickname}`);
            } catch (err) {
                console.error(`❌ 유저 ${userId} 처리 중 오류 발생:`, err);
            }
        }
    } catch (error) {
        console.error("❌ addObserverPemission 함수 실행 중 오류 발생:", error);
    }
}

module.exports = addObserverPemission;
