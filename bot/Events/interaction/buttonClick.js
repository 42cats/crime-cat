const { Client, ButtonInteraction } = require('discord.js');
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');

module.exports = {
    name: 'BUTTON_CLICK',
    /**
     * @param {Client} client
     * @param {ButtonInteraction} interaction
     */
    execute: async (client, interaction) => {
        if (interaction.isButton()) {
            if (!interaction.customId) return;
            let result = await client.redis.getValue(interaction.customId);
            if(!result)
                result = decodeFromString(interaction.customId);
            const { command } = result;
            console.log(`Command: ${command}, custtome id ${interaction.customId} Interaction ${interaction}`);

            // Response 실행
            if (client.responses.buttons.has(command)) {
                const responseHandler = client.responses.buttons.get(command);
                await responseHandler.execute(client, interaction);
            } else {
                // await interaction.reply("만료된 버튼입니다");
                console.log('Unknown button command:', command, client.responses.buttons);
                // await interaction.reply({ content: 'Unknown button command.', ephemeral: true });
            }
        }
    },
};
