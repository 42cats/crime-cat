const { ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const { GuildURL, User } = require('./utility/db');
const delayedDeleteMessage = require('./utility/deleteMsg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const API = process.env.GOOGLE_API;
const deleteUrlList = require('./utility/urlDeleteList');

const nameOfCommand = "주소삭제";
const description = "유튜브 주소삭제";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
		const guildId = interaction.guildId;
		const components = await deleteUrlList(guildId, 0);
		if (!components) {
			const msg = await interaction.reply({ content: "추가된 리스트가 없습니다.", ephemeral: true });
			return;
		}
		await interaction.reply({ components: [components] });
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
			const clientId = message.author.id;
			const guildId = message.guild.id;
			console.log("client id ", clientId, "guild id ", guildId, "guild owner id ", message.guild.ownerId);
			if (clientId !== message.guild.ownerId) return;
			const components = await deleteUrlList(guildId, 0);
			if (!components) {
				const msg = await message.channel.send({ content: "추가된 리스트가 없습니다.", ephemeral: true });
				return;
			}
			const content =
				"```삭제할 리스트를 선택해 주세요\n중복 선택이 가능하고\n이전, 다음 페이지 버튼을 통해서 페이지 이동이 가능합니다.```"
			await message.channel.send({ content, components: [components] });
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};
