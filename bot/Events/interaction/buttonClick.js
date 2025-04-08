// handlers/button/BUTTON_CLICK.js
const { Client, ButtonInteraction } = require('discord.js');
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');

module.exports = {
    name: 'BUTTON_CLICK',
    /**
     * @param {Client} client
     * @param {ButtonInteraction} interaction
     */
    execute: async (client, interaction) => {
        if (!interaction.isButton() || !interaction.customId) return;

        let data = await client.redis.getValue(interaction.customId);
        if (!data) {
            data = decodeFromString(interaction.customId); // fallback 방식
            if (!data?.command) {
                console.log('❌ Unknown or expired button:', interaction.customId);
                return;
            }
        }

        console.log(`🔘 버튼 클릭 감지 → Command: ${data.command}, customId: ${interaction.customId}`);

        const handler = client.responses.buttons.get(data.command);
        if (handler) {
            await handler.execute(client, interaction, data); // Redis에 저장된 데이터 전달
        } else {
            console.log('❌ Unknown button command:', data.command);
        }
    }
};
