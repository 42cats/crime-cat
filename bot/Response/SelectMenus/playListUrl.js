// playListUrl.js
const { Client, StringSelectMenuInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
const { MusicSystemAdapter } = require('../../Commands/utility/MusicSystemAdapter');
dotenv.config();
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');

module.exports = {
    name: "playListUrl",
    /**
     * v4 Playlist Select Menu Handler
     * @param {Client} client 
     * @param {StringSelectMenuInteraction | ButtonInteraction} interaction 
     */
    execute: async (client, interaction) => {
        const { guildId } = interaction;
        
        // v4 플레이어 가져오기
        let player;
        try {
            player = await MusicSystemAdapter.getPlayer(client, guildId, interaction.member);
        } catch (error) {
            console.error('[PlayListUrl] Failed to get player:', error);
            return;
        }
        
        try {
            await interaction.deferUpdate();

            // select menu 처리: 곡 선택만 처리
            if (interaction.isStringSelectMenu()) {
                const selectedValues = interaction.values[0];
                const { command, option, otherOption } = decodeFromString(selectedValues);
                
                // v4에서는 인덱스로 직접 재생
                const trackIndex = parseInt(otherOption);
                console.log('[PlayListUrl] Playing track index:', trackIndex);
                await player.play(trackIndex);
            }
            
            // 인터랙션 메시지 할당
            player.interactionMsg = interaction.message;
            
            // v4 UI 업데이트 (즉시 반영)
            const compData = await player.reply();
            await interaction.editReply(compData);
            
        } catch (e) {
            console.error('[PlayListUrl] Error:', e);
            
            try {
                if (interaction.isRepliable()) {
                    await interaction.editReply({ content: "오류가 발생했습니다." });
                }
                const msg = await interaction.channel.send(String(e));
                await delayedDeleteMessage(msg, 1);
            } catch (err) {
                console.error('[PlayListUrl] Failed to send error message:', err);
            }
        }
    }
};