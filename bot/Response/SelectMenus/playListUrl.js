// playListUrl.js
const { Client, StringSelectMenuInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
dotenv.config();
const delimiterGeter = require('../../Commands/utility/delimiterGeter');

module.exports = {
    name: "playListUrl",
    /**
     * @param {Client} client 
     * @param {StringSelectMenuInteraction | ButtonInteraction} interaction 
     */
    execute: async (client, interaction) => {
        const { guildId } = interaction;
        const musicData = interaction.client.serverMusicData.get(guildId);
        if (!musicData || (musicData && !musicData.isOk)) return;
        musicData.isOk = false;
        try {
            await interaction.deferUpdate();

            // select menu 처리: 곡 선택만 처리 (페이지 관련 항목은 제거됨)
            if (interaction.isStringSelectMenu()) {
                const selectedValues = interaction.values[0];
                const { command, option, otherOption } = delimiterGeter(selectedValues);
                await musicData.play(parseInt(option), true);
            }
            musicData.interactionMsg = interaction.message;
            const compData = await musicData.reply();
            await interaction.editReply(compData);
            musicData.isOk = true;
        } catch (e) {
            console.log(e.stack);
            if (interaction.isRepliable())
                await interaction.editReply({ content: "" });
            const msg = await interaction.channel.send(String(e));
            if (musicData) musicData.isOk = true;
            delayedDeleteMessage(msg, 1);
        }
    }
};
