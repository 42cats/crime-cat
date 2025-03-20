const { ButtonInteraction } = require('discord.js');

module.exports = {
    name: "form",
    /**
     * 
     * @param {Client} client 
     * @param {ButtonInteraction} interaction 
     * @returns 
     */
    async execute(client, interaction) {
        const { customId } = interaction;
        console.log("custom_id", customId);
        const result = await client.redis.getValue(customId);

        if (!result) {
            await interaction.reply("⚠️ 이미 만료된 버튼입니다. 감사합니다.");
            return;
        }

        const { formKey, user, message, data, userName } = result;

        try {
            // Redis에서 응답 버튼 제거 (중복 응답 방지)
            await client.redis.delete(customId);

            // 응답을 해시 테이블에 저장 (formKey 기준으로 업데이트)
            const responses = await client.redis.updateArrayInHash("survey_results", formKey, {
                user,
                userName,
                response: data,
                timestamp: new Date().toISOString()
            });

            // 전체 응답 현황 가져오기
            const totalResponses = responses ? responses.length : 0;

            // master에게 결과 통계 전달
            let responseSummary = `📊 [${message}] 설문 응답 현황 (FormKey: ${formKey})\n`;
            responses?.forEach(({ userName, response, timestamp }) => {
                responseSummary += `👤 ${userName}: ${response} (${timestamp})\n`;
            });

            client.master.send(responseSummary);
            await interaction.reply("✅ 응답해 주셔서 감사합니다!");

        } catch (error) {
            console.error("설문 이벤트 처리 오류:", error);
            await interaction.reply({
                content: "⚠️ 결과 처리 중 오류가 발생했습니다.",
                ephemeral: true
            });
        }
    }
};
