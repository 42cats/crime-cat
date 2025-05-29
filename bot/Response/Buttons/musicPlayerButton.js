const { Client, ButtonInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
dotenv.config();
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');
const {
	AudioPlayerStatus,
} = require('@discordjs/voice');

module.exports = {
	name: "musicPlayerButton",
	/**
	 * 
	 * @param {Client} client 
	 * @param {ButtonInteraction} interaction 
	 * @returns 
	*/
	execute: async (client, interaction) => {
		const { guildId } = interaction;
		const musicData = interaction.client.serverMusicData.get(guildId);
		if (!musicData) {
			if (interaction.isRepliable) {
				const msg = await interaction.reply("플레이어 정보가 없습니다. 다시 생성해 주세요");
				await delayedDeleteMessage(msg, 2);
			}
			return;
		}

		if (!interaction.member.permissions.has('ADMINISTRATOR')) return;

		try {
			const { command, option, otherOption } = decodeFromString(interaction.customId);
			console.log("command button id", command, option, otherOption);

			switch (option) {
				case `prev`:
					await musicData.prev();
					break;
				case `playpause`:
					if (musicData.audioPlayerManager.player?.state.status === AudioPlayerStatus.Playing)
						await musicData.pause();
					else if (musicData.audioPlayerManager.player?.state.status === AudioPlayerStatus.Paused)
						await musicData.resume();
					else if ((musicData.audioPlayerManager.player?.state.status === AudioPlayerStatus.Idle))
						await musicData.play(musicData.playlistManager.currentIndex);
					break;
				case `playstop`:
					await musicData.stop();
					break;
				case `onOff`:
					await musicData.onOff();
					break;
				case `next`:
					await musicData.next();
					break;
				case `mode`:
					await musicData.setPlayMode();
					break;
				case `sort`:
					musicData.sortList();
					break;
				case `volumeUp`:
					musicData.volumeUp();
					break;
				case `volumeDown`:
					musicData.volumeDown();
					break;
				case 'Local':
					musicData.togleLocal();
					await musicData.playlistManager.refresh();
					break;
				case `exit`:
					const isdel = await musicData.destroy();
					if (this.interactionMsg) {
						// 시스템 메시지 확인 추가
						if (this.interactionMsg.deletable && !this.interactionMsg.system) {
							this.interactionMsg.delete().catch(err => console.error('메시지 삭제 오류:', err));
							return true;
						} else {
							console.log("시스템 메시지이거나 삭제할 수 없는 메시지입니다.");
							return false;
						}
					}
					await interaction.client.serverMusicData.delete(guildId);
					return;
			}
		}
		catch (e) {
			console.log(e.stack);
			try {
				const msg = await interaction.reply({ content: String(e), ephemeral: true });
				await delayedDeleteMessage(msg, 2);
			} catch (_) { }
			return;
		}

		musicData.interactionMsg = interaction.message;

		// UI 해시를 비교하여 변경사항이 있을 때만 업데이트
		const currentHash = musicData.getUIHash();
		if (currentHash !== musicData.lastUIHash || !musicData.lastUIHash) {
			musicData.lastUIHash = currentHash;
			const compData = await musicData.reply();
			try {
				await interaction.update(compData);
			} catch (e) {
				if (e.code === 10062) {
					// 토큰 만료된 경우, followUp 으로 대체
					await interaction.followUp({ content: "버튼 업데이트 시간이 초과되었습니다.", ephemeral: true })
						.catch(err => { if (err.code !== 10062) console.error("fallback followUp failed:", err); });
				} else {
					console.error("interaction.update failed:", e);
				}
			}
		} else {
			// UI 변경사항이 없으면 defer만 하고 업데이트하지 않음
			await interaction.deferUpdate();
		}
	}
};
