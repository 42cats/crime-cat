const { ChannelType, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const prefix = process.env.PRIFIX;
module.exports = {
	name: 'messageCreate',
	once: false,

	execute: async (message) => {
		const client = message.client;
		try {
			if (!message.author.bot && message.channel.type === ChannelType.DM) {
				const event = client.events.get("dmMessage");
				if (!event) return;
				await event.execute(client, message);
				return; // DM 처리 후 종료
			}
			if (message.author.bot || !message.content.startsWith(prefix)) return;
			const args = message.content.slice(prefix.length).trim().split(/ +/);
			const commandName = args.shift().toLowerCase();
			if (!commandName) return;  // 빈 문자열이면 리턴
			let command = client.prefixCommands.get(commandName);
			if (!command) {
				for (const [key, aliases] of client.aliasesMap) {
					console.log("key = ", key, "aliases = ", aliases);
					if (key.includes(commandName)) {
						command = client.prefixCommands.get(aliases);; // 원래 명령어로 매핑
						break;
					}
				}
			}
			if (!command) return; // 명령어가 없으면 종료

			// 관리자 권한이 필요한 경우와 권한 확인
			if (command.permissionLevel === PermissionFlagsBits.Administrator &&
				!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
				return;
			}
			try {
				await command.prefixCommand.execute(message, args);
			} catch (error) {
				console.error(error.stack);
				await message.channel.send(`프리픽스 명령어 ${commandName}실행 중 오류가 발생했습니다.`);
			};
			if (message.deletable && !message.system)
				await message.delete();
		}
		catch (e) {
			console.log(e.stack);
		}
	}
}