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
					if (this.interactionMsg.deletable && !this.interactionMsg.system) await interaction.message.delete();
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
		const compData = await musicData.reply();
		await interaction.update(compData);
	}
};
