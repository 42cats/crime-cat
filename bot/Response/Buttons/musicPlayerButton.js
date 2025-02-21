const { Client, ButtonInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
dotenv.config();
const delimiterGeter = require('../../Commands/utility/delimiterGeter');
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
		if (musicData) {
			console.log("music response come");
			if (interaction.user.id !== interaction.guild.ownerId) return;
			console.log("11");
			if (!musicData.isOk) {
			console.log("12");
				const msg = await interaction.reply("너무 잦은 입력이 진행중입니다. 1초에 1번의 입력을 지원합니다.");
				await delayedDeleteMessage(msg, 1);
				return;
			}
			console.log("13");
			try {
					musicData.isOk = false;
					const {command,option,otherOption} = delimiterGeter(interaction.customId);
					console.log("command button id", command,option,otherOption);
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
							musicData.stop();
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
							if (!isdel)
								await interaction.message.delete();
							await interaction.client.serverMusicData.delete(guildId);
							musicData.isOk = true;
							return;
					}
			}
			catch (e) {
				console.log(e.stack);
				try {
					const msg = await interaction.reply({ content: String(e), ephemeral: true });
					await delayedDeleteMessage(msg, 2);
				}
				catch (e) {
				}
				if(musicData) musicData.isOk = true;
				return;
			}
			musicData.interactionMsg = interaction.message;
			const compData = await musicData.reply();
			await interaction.update(compData);
			musicData.isOk = true;
		}
		else {
			if (interaction.isRepliable) {
				const msg = await interaction.reply("플레이어 정보가 없습니다. 다시 생성해 주세요");
				await delayedDeleteMessage(msg, 2);
			}
			return;
		}
	}
}