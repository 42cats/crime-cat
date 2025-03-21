// commands/ping.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, Message, AttachmentBuilder, PermissionFlagsBits } = require('discord.js')
const { User: UserDb } = require('./utility/db');
const dotenv = require('dotenv');
const UserInfoImage = require('./utility/userInfoToImage');
const delayedDeleteMessage = require('./utility/deleteMsg');
dotenv.config();
const prefix = process.env.PRIFIX;
const nameOfCommand = "알림";
const description = "플레이 시작시 디스코드 디엠으로 정보 전송합니다(내가 한 크라임씬만)";

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
			const msg = await alertToggle(interaction.user);
			await interaction.reply(msg);
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
			const content = await alertToggle(message.author);
			try {
				const msg = await message.channel.send(content);
				delayedDeleteMessage(msg, 2);

			} catch (error) {
				console.log("message error", error.stack);
			}
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.DeafenMembers
};

async function alertToggle(targetUser) {
	try {
		// 데이터베이스에서 사용자 정보 찾기
		const user = await UserDb.findOne({ where: { user_id: targetUser.id } });

		if (!user) {
			return { content: '해당 사용자를 데이터베이스에서 찾을 수 없습니다.', ephemeral: true };
		}

		// alert_ok 값 토글
		user.alert_ok = !user.alert_ok;
		await user.save();
		console.log(targetUser);
		return { content: `${targetUser.globalName}님의 알림 상태가 ${user.alert_ok ? '활성화' : '비활성화'}되었습니다.`, ephemeral: true };
	} catch (error) {
		console.error('알림 상태 토글 중 오류 발생:', error);
		return { content: '알림 상태를 변경하는 중 오류가 발생했습니다.', ephemeral: true };
	}
}