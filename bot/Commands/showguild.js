// commands/ping.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Message } = require('discord.js')
const dotenv = require('dotenv');
dotenv.config();
const prefix = process.env.PRIFIX;

const nameOfCommand = "showguild";
const description = "길드표출";
module.exports = {
	// 슬래시 명령어 정의
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description),

	// 슬래시 명령어 실행
	async execute(interaction) {
		await interaction.reply('dbcreate! 슬래시 명령어');
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		/**
		 * 
		 * @param {Message} message 
		 * @param {*} args 
		 * @returns 
		 */
		async execute(message, args) {
			// 명령어 사용 권한 확인
			if (message.author.id !== '317655426868969482') return;

			const guildMaps = new Map();
			const client = message.client;

			await message.reply('길드목록 가져오는 중...');

			// 모든 길드 가져오기
			const list = client.guilds.cache;
			for (const guild of list.values()) {
				// 길드 소유자 정보 가져오기
				const guildOwner = await client.users.fetch(guild.ownerId);

				// 길드맵에 추가
				if (!guildMaps.has(guildOwner.tag)) {
					guildMaps.set(guildOwner.tag, []);
				}
				guildMaps.get(guildOwner.tag).push(guild.name);
			}

			// 최종 결과 출력
			for (const [ownerName, guildList] of guildMaps.entries()) {
				await message.channel.send(`길드 마스터: ${ownerName}\n길드 목록: ${guildList.join(', ')}`);
			}

			await message.reply(`총 ${list.size}개의 길드 정보를 가져왔습니다.`);
		}
	},
	upload: false,
	permissionLevel: -1
};
