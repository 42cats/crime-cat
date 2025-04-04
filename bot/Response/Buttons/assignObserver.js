const { PermissionFlagsBits, Client, ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {decodeFromString} = require('../../Commands/utility/delimiterGeter');
const addObserverPermission = require('../../Commands/utility/addObserverPemission');

module.exports = {
    name: "assignObserver",
    /**
     * 
     * @param {Client} client 
     * @param {ButtonInteraction} interaction 
     * @returns 
     */
    async execute(client, interaction) {
        try {
            const { customId } = interaction;
            console.log("custom_id", customId);
            const { head: guild_Id } = decodeFromString(customId);
            const users = Array.from(client.voteStorage.get(guild_Id).keys());
            await addObserverPermission(client, guild_Id, users);
            client.voteStorage.delete(guild_Id);
            await interaction.reply({
                content: "✅ 정상적으로 권한이 관전 권한이 부여되었습니다..",
                ephemeral: true
            });

        } catch (error) {
            console.error("투표종료후 권한 부여중 오류:", error.stack);
            await interaction.reply({
                content: "⚠️ 결과 처리 중 오류가 발생했습니다.",
                ephemeral: true
            });
        }
    }
};
