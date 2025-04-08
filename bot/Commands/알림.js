// commands/ping.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Message, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('./utility/deleteMsg');
const { setUserAlarm, getUserDbInfo } = require('./api/user/user');
dotenv.config();

const prefix = process.env.PRIFIX;
const nameOfCommand = "알림";
const description = "플레이 시작시 디스코드 디엠으로 정보 전송합니다(내가 한 크라임씬만)";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

	async execute(interaction) {
		try {
			const userInfo = await getUserDbInfo(interaction.user.id);

			if (!userInfo || Object.keys(userInfo).length === 0) {
				await interaction.reply({ content: "❗ 유저 정보를 찾을 수 없습니다.관리자에게 문의해 주세요.", ephemeral: true });
				return;
			}

			await setUserAlarm(interaction.user.id, !userInfo.discordAlarm);
			await interaction.reply(`알림이 ${!userInfo.discordAlarm ? "활성화 되었습니다." : "비활성화 되었습니다."}`);
		} catch (error) {
			console.log("interaction userinfo error ", error.stack);
		}
	},

	prefixCommand: {
		name: nameOfCommand,
		description: description,
		/**
		 * @param {Message} message
		 * @param {Array} args
		 */
		async execute(message, args) {
			try {
				const userInfo = await getUserDbInfo(message.author.id);

				if (!userInfo || Object.keys(userInfo).length === 0) {
					await message.reply("❗ 유저 정보를 찾을 수 없습니다. 관리자에게 문의해 주세요.");
					return;
				}

				await setUserAlarm(message.author.id, !userInfo.discordAlarm);
				const msg = await message.channel.send(`알림이 ${!userInfo.discordAlarm ? "활성화 되었습니다." : "비활성화 되었습니다."}`);
				delayedDeleteMessage(msg, 2);
			} catch (error) {
				console.log("message error", error.stack);
			}
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.DeafenMembers
};
