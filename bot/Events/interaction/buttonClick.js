const { Client, ButtonInteraction } = require('discord.js');
const delimiterGeter = require('../../Commands/utility/delimiterGeter');

module.exports = {
    name: 'BUTTON_CLICK',
    /**
     * @param {Client} client
     * @param {ButtonInteraction} interaction
     */
    execute: async (client, interaction) => {
        if (interaction.isButton()) {
            if (!interaction.customId) return;
            const { command } = delimiterGeter(interaction.customId);
            console.log(`Command: ${command}`);

            // Response 실행
            if (client.responses.buttons.has(command)) {
                const responseHandler = client.responses.buttons.get(command);
                await responseHandler.execute(client, interaction);
            } else {
                console.log('Unknown button command:', command, client.responses.buttons);
                // await interaction.reply({ content: 'Unknown button command.', ephemeral: true });
            }
        }
    },
};
