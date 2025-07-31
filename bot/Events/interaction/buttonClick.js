// Events/interaction/buttonClick.js
const { Client, ButtonInteraction } = require('discord.js');
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');
const { handleButtonAutomation } = require('../../Response/ButtonAutomationHandler');

module.exports = {
    name: 'BUTTON_CLICK',
    once: false,

    /**
     * @param {Client} client
     * @param {ButtonInteraction} interaction
     */
    execute: async (client, interaction) => {
        if (!interaction.isButton() || !interaction.customId) return;

        try {
            // 자동화 버튼인지 확인
            if (interaction.customId.startsWith('automation_')) {
                await handleButtonAutomation(interaction);
                return;
            }

            // 기존 버튼 처리 로직
            // 레디스에서 데이터 가져오기 시도
            let data = null;
            try {
                data = await client.redis.getValue(interaction.customId);
            } catch (redisError) {
                console.warn('⚠️ Redis 조회 실패:', redisError.message);
            }

            // 레디스에 데이터가 없으면 fallback으로 커스텀ID 직접 파싱
            if (!data) {
                try {
                    data = decodeFromString(interaction.customId); // fallback 방식
                    if (!data?.command) {
                        console.log('❌ Unknown or expired button:', interaction.customId);
                        return;
                    }
                    console.log('📦 Fallback 파싱 성공:', data);
                } catch (parseError) {
                    console.error('❌ 커스텀ID 파싱 실패:', parseError.message);
                    return;
                }
            }

            console.log(`🔘 버튼 클릭 감지 → Command: ${data.command}, customId: ${interaction.customId}`);

            // 해당 커맨드에 맞는 핸들러 찾기
            const handler = client.responses.buttons.get(data.command);
            if (handler) {
                // 인터랙션 만료 확인 (15분 = 900초)
                const interactionAge = Date.now() - interaction.createdTimestamp;
                if (interactionAge > 890000) { // 14분 50초로 안전 마진
                    console.warn(`⚠️ 인터랙션 만료 임박: ${Math.floor(interactionAge/1000)}초 경과`);
                    return;
                }
                
                await handler.execute(client, interaction, data); // Redis에 저장된 데이터 전달
            } else {
                console.log('❌ Unknown button command:', data.command);
            }
        } catch (error) {
            console.error('[오류] 버튼 처리 중 오류:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ 버튼 처리 중 오류가 발생했습니다.',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('[오류] 버튼 오류 응답 실패:', replyError);
            }
        }
    }
};