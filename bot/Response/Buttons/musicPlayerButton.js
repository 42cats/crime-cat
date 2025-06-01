const { Client, ButtonInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
const { MusicSystemAdapter } = require('../../Commands/utility/MusicSystemAdapter');
dotenv.config();
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');

module.exports = {
	name: "musicPlayerButton",
	/**
	 * v4 Music Player Button Handler
	 * @param {Client} client 
	 * @param {ButtonInteraction} interaction 
	 * @returns 
	*/
	execute: async (client, interaction) => {
		const { guildId } = interaction;
		
		// v4 플레이어 가져오기
		let player;
		try {
			player = await MusicSystemAdapter.getPlayer(client, guildId, interaction.member);
		} catch (error) {
			console.error('[MusicPlayerButton] Failed to get player:', error);
			if (interaction.isRepliable()) {
				const msg = await interaction.reply("플레이어 정보가 없습니다. 다시 생성해 주세요");
				await delayedDeleteMessage(msg, 2);
			}
			return;
		}

		if (!interaction.member.permissions.has('Administrator')) return;

		try {
			const { command, option, otherOption } = decodeFromString(interaction.customId);
			console.log("[MusicPlayerButton v4] command:", command, "option:", option, "otherOption:", otherOption);

			// v4 플레이어 메서드 호출
			switch (option) {
				case `prev`:
					await player.prev();
					break;
				case `playpause`:
					await player.togglePlayPause();
					break;
				case `playstop`:
					await player.stop();
					break;
				case `onOff`:
					// 자동재생 토글
					player.toggleAutoplay();
					break;
				case `next`:
					await player.next();
					break;
				case `mode`:
					// 모드 순환
					await player.toggleMode();
					break;
				case `sort`:
					// 정렬 토글
					await player.toggleSort();
					break;
				case `volumeUp`:
					await player.volumeUp();
					break;
				case `volumeDown`:
					await player.volumeDown();
					break;
				case 'Local':
					// 소스 전환
					await player.toggleSource();
					break;
				case `exit`:
					// v4 플레이어 정리
					await player.destroy();
					
					// Map에서 제거
					client.serverMusicData.delete(guildId);
					return;
			}
		}
		catch (e) {
			console.error('[MusicPlayerButton] Error:', e);
			try {
				const msg = await interaction.reply({ content: String(e), ephemeral: true });
				await delayedDeleteMessage(msg, 2);
			} catch (_) { }
			return;
		}

		// 인터랙션 메시지 할당
		player.interactionMsg = interaction.message;

		// v4 UI 업데이트 시스템 (즉시 업데이트)
		try {
			const compData = await player.reply();
			await interaction.update(compData);
		} catch (e) {
			if (e.code === 10062) {
				// 토큰 만료된 경우
				await interaction.deferUpdate().catch(() => {});
			} else {
				console.error("[MusicPlayerButton] Update failed:", e);
				await interaction.deferUpdate().catch(() => {});
			}
		}
	}
};