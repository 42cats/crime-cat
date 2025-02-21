const { Client, ButtonInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
dotenv.config();
const delimiterGeter = require('../../Commands/utility/delimiterGeter');
const {
	AudioPlayerStatus,
} = require('@discordjs/voice');


module.exports = {

	name: "request",
	/**
	 * 
	 * @param {Client} client 
	 * @param {ButtonInteraction} interaction 
	 * @returns 
	*/
	execute: async (client, interaction) => {
		const { head, command, option } = delimiterGeter(interaction.customId);
		if (option === 'accept') {
			if (interaction.message.deletable)
				interaction.message.delete();
			const target = await client.user.fetch(head);
			target?.send("협조에 감사드립니다!");
		}
		else if (option === 'refuse') {
			if (interaction.message.deletable)
				interaction.message.delete();
			const target = await client.user.fetch(head);
			target?.send("약관에 동의하지 않으면 사용할 수 없습니다.");
			const list = [...client.guilds.valueOf().values()];
			list.map(v => {
				if (v.ownerId === head)
					v.leave();
			})
	}
	}
}