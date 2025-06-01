// pageNation.js - v4 Music Player
const { Client, ButtonInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
const { MusicSystemAdapter } = require('../../Commands/utility/MusicSystemAdapter');
dotenv.config();
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');

module.exports = {
    name: "pageNation",
    /**
     * v4 Pagination Button Handler
     * @param {Client} client 
     * @param {ButtonInteraction} interaction 
     */
    execute: async (client, interaction) => {
        const { guildId } = interaction;
        
        // v4 플레이어 가져오기
        let player;
        try {
            player = await MusicSystemAdapter.getPlayer(client, guildId, interaction.member);
        } catch (error) {
            console.error('[PageNation] Failed to get player:', error);
            return;
        }
        
        try {
            await interaction.deferUpdate();
            
            // 버튼 인터랙션 처리: 페이지네이션 버튼  
            if (interaction.isButton()) {
                const customId = interaction.customId;
                const { option } = decodeFromString(customId);
                
                console.log('[PageNation] Button clicked:', option);
                
                if (option === "pageFirst") {
                    player.goToFirstPage();
                } else if (option === "pagePrev") {
                    player.prevPage();
                } else if (option === "pageNext") {
                    player.nextPage();
                } else if (option === "pageLast") {
                    player.goToLastPage();
                }
            }
            
            // 인터랙션 메시지 할당
            player.interactionMsg = interaction.message;
            
            // v4 UI 업데이트
            const compData = await player.reply();
            await interaction.editReply(compData);
            
        } catch (e) {
            console.error('[PageNation] Error:', e);
            
            try {
                if (interaction.isRepliable()) {
                    await interaction.editReply({ content: "페이지 변경 중 오류가 발생했습니다." });
                }
                const msg = await interaction.channel.send(String(e));
                await delayedDeleteMessage(msg, 1);
            } catch (err) {
                console.error('[PageNation] Failed to send error message:', err);
            }
        }
    }
};
