const { decodeFromString } = require('../../Commands/utility/delimiterGeter');
const { Client, StringSelectMenuInteraction } = require('discord.js');
module.exports = {
    name: 'SELECT_MENU',
    once: false,
    /**
     * @param {Client} client
     * @param {StringSelectMenuInteraction} interaction
     */
    execute: async (client, interaction) => {
        if (interaction.isStringSelectMenu()) {
            const { command } = decodeFromString(interaction.values[0]);
            console.log(`Command: ${command}`);

            // Response 실행
            if (client.responses.selectmenus.has(command)) {
                const responseHandler = client.responses.selectmenus.get(command);
                await responseHandler.execute(client, interaction);
            } else {
                console.log('Unknown select menu command:', command);
            }
        }
    },
};
