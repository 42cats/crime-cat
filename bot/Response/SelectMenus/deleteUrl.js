const { Client, StringSelectMenuInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
dotenv.config();
const delimiterGeter = require('../../Commands/utility/delimiterGeter');
const deleteUrlList = require('../../Commands/utility/urlDeleteList');
const { deleteUrl } = require('../../Commands/utility/discord_db');


module.exports = {

	name: "deleteUrl",
	/**
	 * 
	 * @param {Client} client 
	 * @param {StringSelectMenuInteraction} interaction 
	 * @returns 
	*/
	execute: async (client, interaction) => {
		const guildId = interaction.guildId;
		const { head, command, option, otherOption } = delimiterGeter(interaction.values[0]);
		console.log("urldelete ", head, command, option, otherOption);
		if (interaction.values.length === 1 && option === 'prevPage' || option === 'nextPage') {
			console.log(" in option = ", delimiterGeter(interaction.values[0], ":", "?"), " .  ", interaction.values.length);
			const page = otherOption;
			try {
				const components = await deleteUrlList(guildId, parseInt(page));
				console.log("compoment = ", components);
				if (!components) {
					const msg = await interaction.reply("요청하신 페이지가 없습니다.");
					await delayedDeleteMessage(msg, 1);
					return;
				}
				await interaction.update({ components: [components] });
				return;
			}
			catch (e) {
				console.log(e.stack);
			}
		}
		const titles = [];
		interaction.values.filter(v => {
			const {option} = delimiterGeter(v);
			const data = option;
			console.log("v value = ", v);
			if (data === 'Page' || data === 'none' || data === 'prevPage' || data === 'nextPage')
				return false;
			titles.push(data);
			return false;
		})
		if (titles.length < 1) {
			await interaction.reply("선택된 음악이 없습니다.");
			return;
		}
		if (command === 'deleteUrl') {
			titles.map(async v => {
				console.log("삭제 타이틀 ", v);
				await deleteUrl(guildId, v);
			});
			const msg = await interaction.reply(titles + " 삭제됨");
			await interaction.message.delete();
			await updatePlayer(interaction.client, guildId);
			await delayedDeleteMessage(msg, 1);
		}
	}

}

/**
 * 
 * @param {Client} client 
 */
async function updatePlayer(client,guildId) {
	if (!client.serverMusicData.has(guildId)) {
		return;
	}
	const musicData = client.serverMusicData.get(guildId);
	await musicData.playlistManager.refresh();
	const components = await musicData.reply();
	await musicData.interactionMsg.edit(components);
}