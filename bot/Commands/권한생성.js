// commands/ping.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('@discordjs/builders');
const dotenv = require('dotenv');
const { addPermisson } = require('./api/user/permission');
dotenv.config();
const prefix = process.env.PRIFIX;

const nameOfCommand = "권한생성";
const description = "권한생성";
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
		if (args.length < 2) {
			return await message.reply(
				'```사용법: !권한생성 권한이름 가격 [기간(일)]\n예시: !권한생성 관전 500 14```'
			);
		}

		const permissionName = args[0];
		const price = Number(args[1]);

		if (isNaN(price)) {
			return await message.reply('```가격은 숫자로 입력해야 합니다.```');
		}

		const duration = args[2] ? Number(args[2]) : 28;
		if (args[3] && isNaN(duration)) {
			return await message.reply('```기간(일)은 숫자로 입력해야 합니다.```');
		}

		try {
			const response = await addPermisson(permissionName, price, duration);
			await message.reply(
				`✔ 권한 생성 완료\n권한 이름: ${permissionName}\n가격: ${price}\n기간: ${duration}일\n${response.data.message}`
			);
		} catch (error) {
			console.error('권한 생성 실패:', error);
			await message.reply('❌ 권한 생성 중 오류가 발생했습니다.');
		}
	}
	},
	upload: false,
	permissionLevel: -1
};
