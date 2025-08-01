// commands/ping.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, Message, AttachmentBuilder, PermissionFlagsBits } = require('discord.js')
const dotenv = require('dotenv');
const UserInfoImage = require('./utility/userInfoToImage');
dotenv.config();
const prefix = process.env.PRIFIX;
const nameOfCommand = "정보";
const description = "본인의 정보를 확인합니다";

module.exports = {
	// 슬래시 명령어 정의
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

	// 슬래시 명령어 실행
	async execute(interaction) {
		const image = await UserInfoImage(interaction.user);
		try {
			await interaction.reply({ embeds: [image] });
		} catch (error) {
			console.log("interaction userinfo error ", error.stack);
		}
	},

	// Prefix 명령어 정의
	prefixCommand: {
		name: nameOfCommand,
		description: description,
		/**
		 * 
		 * @param {Message} message
		 * @param {Array} args
		 */
		async execute(message, args) {
			const client = message.client;
			const list = client.guilds.cache;
			const image = await UserInfoImage(message.author);
			try {
				await message.channel.send({ embeds: [image] });

			} catch (error) {
				console.log("message error", error.stack);
			}
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.DeafenMembers,
	isCacheCommand: false,
};