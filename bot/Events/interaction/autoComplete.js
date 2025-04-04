const {decodeFromString} = require('../../Commands/utility/delimiterGeter');
const { Client,ButtonInteraction } = require('discord.js');
module.exports = {
    name: 'AUTO_COMPLETE',
    /**
     * @param {Client} client
     * @param {StringSelectMenuInteraction} interaction
     */
    execute: async (client, interaction) => {
        if (interaction.isStringSelectMenu()) {
            const {command} = decodeFromString(interaction.values[0]);
            console.log(`Command: ${command}`);

            // Response 실행
            if (client.responses.selectMenus.has(command)) {
                const responseHandler = client.responses.selectMenus.get(command);
                await responseHandler.execute(client, interaction);
            } else {
                console.log('Unknown select menu command:', command);
            }
        }
    },
};
