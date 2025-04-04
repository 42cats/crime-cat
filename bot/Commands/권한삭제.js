// commands/ping.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('@discordjs/builders');
const dotenv = require('dotenv');
const { addPermisson, deletePermisson } = require('./api/user/permission');
dotenv.config();
const prefix = process.env.PRIFIX;

const nameOfCommand = "권한삭제";
const description = "권한삭제";
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
// Prefix 명령어 정의
prefixCommand: {
	name: nameOfCommand,
	description,
	async execute(message, args) {
		// 권한 제한
		if (message.author.id !== '317655426868969482') return;
		console.log("args ", args);
		// 잘못된 인자 수 확인
		if (args.length < 0) {
			return await message.reply(
				'```사용법: !권한삭제 권한이름 !권한삭제 관전 ```'
			);
		}

		const permissionName = args[0];

		try {
			const response = await deletePermisson(permissionName);
			await message.reply(
				`✔ 권한 삭제 완료\n권한 이름: ${permissionName} ${response.data.message}`
			);
		} catch (error) {
			console.error('권한 삭제 실패:', error);
			await message.reply('❌ 권한 삭제 중 오류가 발생했습니다.');
		}
	}
	},
	upload: false,
	permissionLevel: -1
};
