// playListUrl.js
const { Client, StringSelectMenuInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
dotenv.config();
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');

module.exports = {
    name: "pageNation",
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
            // 버튼 인터랙션 처리: 외부 페이지네이션 버튼  
            // 커스텀 아이디가 단순 형식이므로 endsWith()로 판별합니다.
            if (interaction.isButton()) {
                const customId = interaction.customId;
                const { option } = decodeFromString(customId);
                if (option === "pageFirst") {
                    musicData.firstPage();
                } else if (option === "pagePrev") {
                    musicData.prevPage();
                } else if (option === "pageNext") {
                    musicData.nextPage();
                } else if (option === "pageLast") {
                    musicData.lastPage();
                }
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
