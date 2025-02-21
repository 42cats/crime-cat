// commands/ping.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('@discordjs/builders');
const { processGuildAndUsersWithHistory } = require('./utility/discord_db');
const dotenv = require('dotenv');
dotenv.config();
const prefix = process.env.PRIFIX;

const nameOfCommand = "bc";
const description = "brodcast";
module.exports = {
	// 슬래시 명령어 정의
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description),

	// 슬래시 명령어 실행
	async execute(interaction) {
		await interaction.reply('dbcreate! 슬래시 명령어');
	},

	// Prefix 명령어 정의
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (message.author.id !== '317655426868969482') return;
			const client = message.client;
			const msg = args.join(" ");
			await message.reply(msg);
			const list = client.guilds.cache;
			const ownerSet = new Set(); // 중복을 제거할 Set 생성
			let counter = 0;

			for (const v of list.values()) {
				// 중복 검사: ownerId가 이미 처리되었는지 확인
				if (ownerSet.has(v.ownerId)) continue;
				// Set에 추가
				ownerSet.add(v.ownerId);
			}
			for (const v of ownerSet) {
				try {
					const owner = await client.users.fetch(v);
					await message.channel.send(`${owner.globalName} 님에게 전송`)
					await owner.send(msg);
					counter++;
				} catch (err) {
					console.error('Error processing guild:', err);
					break; // 에러 발생 시 즉시 루프 중단
				}
			}
			await message.reply(`메시지 전송 끝.  ${counter}`);
		}
	},
	upload: false,
	permissionLevel: -1
};
