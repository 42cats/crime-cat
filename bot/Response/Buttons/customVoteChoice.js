const { ButtonInteraction, Client } = require('discord.js');
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');

module.exports = {
    name: "customVoteChoice",
    /**
     * @param {Client} client 
     * @param {ButtonInteraction} interaction 
     */
    async execute(client, interaction) {
        const { customId, user } = interaction;
        const { head: voteId, option: choice } = decodeFromString(customId);
        const redis = client.redis;
        
        // Rate limiting 체크
        const rateLimitKey = `ratelimit:vote:${user.id}`;
        const isRateLimited = await redis.exists(rateLimitKey);
        
        if (isRateLimited) {
            return await interaction.reply({
                content: '⏱️ 너무 빠른 요청입니다. 3초 후 다시 시도해주세요.',
                ephemeral: true
            });
        }
        
        // Rate limit 설정 (3초)
        await redis.client.setEx(rateLimitKey, 3, '1');
        
        try {
            // 투표 메타데이터 확인
            const metaData = await redis.getHash(`vote:${voteId}:meta`, 'data');
            if (!metaData) {
                return await interaction.reply({
                    content: '❌ 종료되었거나 존재하지 않는 투표입니다.',
                    ephemeral: true
                });
            }
            
            // 시간 제한 확인
            if (metaData.endTime && Date.now() > metaData.endTime) {
                return await interaction.reply({
                    content: '⏰ 투표 시간이 종료되었습니다.',
                    ephemeral: true
                });
            }
            
            // 이전 투표 확인
            const previousChoice = await redis.client.hGet(`vote:${voteId}:userChoice`, user.id);
            
            // Redis 트랜잭션으로 원자적 처리
            const multi = redis.client.multi();
            
            // 이전 투표가 있으면 제거
            if (previousChoice) {
                multi.sRem(`vote:${voteId}:voters:${previousChoice}`, user.id);
            }
            
            // 새 투표 추가
            multi.sAdd(`vote:${voteId}:voters:${choice}`, user.id);
            multi.hSet(`vote:${voteId}:userChoice`, user.id, choice);
            
            // 트랜잭션 실행
            await multi.exec();
            
            // 응답 메시지
            let responseMsg;
            if (previousChoice && previousChoice !== choice) {
                responseMsg = `✅ 투표를 **${previousChoice}**에서 **${choice}**로 변경했습니다!`;
            } else if (previousChoice === choice) {
                responseMsg = `✅ 이미 **${choice}**에 투표하셨습니다.`;
            } else {
                responseMsg = `✅ **${choice}**에 투표하셨습니다!`;
            }
            
            await interaction.reply({
                content: responseMsg,
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Vote choice error:', error);
            await interaction.reply({
                content: '❌ 투표 처리 중 오류가 발생했습니다.',
                ephemeral: true
            });
        }
    }
};