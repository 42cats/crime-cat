const { SlashCommandBuilder } = require('discord.js');

const nameOfCommand = "dm";
const description = "dmToUser";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description),
	async execute(interaction) {
		console.log(interaction);
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (message.author.id !== '317655426868969482') return;

			// args가 비어있으면 종료
			if (args.length === 0) {
				return message.reply("❌ 메시지를 입력해주세요.");
			}

			console.log("message =", message);
			console.log("client =", message.client);

			const client = message.client;
			const targetUserId = args[0];
			const msgContent = args.slice(1).join(" ");

			// args[0]이 숫자로만 구성된 경우 유저 ID로 간주
			if (/^\d+$/.test(targetUserId)) {
				try {
					const user = await client.users.fetch(targetUserId);
					if (!user) {
						return message.reply("⚠️ 해당 유저를 찾을 수 없습니다.");
					}
					client.replyUserDm = user;
					await user.send(msgContent);
					console.log(`📨 ${user.username} (${user.id}) 에게 DM 전송: ${msgContent}`);
					return message.reply(`✅ **${user.username}**에게 DM을 전송했습니다.`);
				} catch (error) {
					console.error("❌ 유저 찾기 오류:", error);
					return message.reply("⚠️ 유저를 찾을 수 없습니다.");
				}
			}

			// 기존 방식 (args[0]이 숫자가 아닐 경우)
			if (client.replyUserDm) {
				client.replyUserDm.send(args.join(" "));
				console.log("📨 replyUserDm 에게 DM 전송:", args.join(" "));
			}
		}
	},
	upload: false,
	permissionLevel: -1
};
