const { SlashCommandBuilder, PermissionFlagsBits, User, Message } = require('discord.js');
const { GradeCode, User: UserDb } = require('./utility/db'); // GradeCode 모델의 실제 경로에 맞게 수정
const { getUserInfo } = require('./utility/discord_db');
const nameOfCommand = "코드사용";
const description = "입력한 12자리 코드를 사용 처리합니다. (미사용 코드에 한해 현재 시점으로 사용 처리)";

module.exports = {
	aliases: [],
	// Slash Command 등록 설정
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option
				.setName('코드')
				.setDescription('사용할 12자리 코드를 입력하세요')
				.setRequired(true)
		)
	,

	/**
	 * Slash Command 실행 함수
	 * @param {import('discord.js').Interaction} interaction 
	 */
	async execute(interaction) {
		const codeInput = interaction.options.getString('코드');
		try {
			// GradeCode 테이블에서 해당 코드 조회
			const gradeCode = await GradeCode.findOne({ where: { code: codeInput } });
			if (!gradeCode) {
				return await interaction.reply({ content: "해당 코드를 찾을 수 없습니다.", ephemeral: true });
			}
			// 이미 사용된 코드인지 확인 (is_used 컬럼이 null이 아니면 사용된 것으로 간주)
			if (gradeCode.is_used) {
				return await interaction.reply({ content: "해당 코드는 이미 사용되었습니다.", ephemeral: true });
			}
			// 미사용 코드이면 현재 날짜로 is_used 업데이트
			await pointAdd(interaction.user, gradeCode.price);
			gradeCode.is_used = new Date();
			gradeCode.user_id = interaction.user.id;
			console.log("grade code = ",gradeCode);
			await gradeCode.save();
			const { point } = await getUserInfo(interaction.user);
			return await interaction.reply({ content: `코드 **${codeInput}** 가 성공적으로 사용 처리되었습니다. \n 현재 포인트 ${point}`, ephemeral: true });
		} catch (error) {
			console.error("코드사용 명령어 오류:", error);
			return await interaction.reply({ content: "코드 사용 처리 중 오류가 발생했습니다.", ephemeral: true });
		}
	},

	// (선택 사항) Prefix Command 구현
	prefixCommand: {
		name: nameOfCommand,
		description,
		/**
		 * 
		 * @param {Message} message 
		 * @param {Array} args 
		 * @returns 
		 */
		async execute(message, args) {
			const codeInput = args[0];
			if (!codeInput) return message.channel.send("사용할 코드를 입력해주세요.");
			try {
				const gradeCode = await GradeCode.findOne({ where: { code: codeInput } });
				if (!gradeCode) {
					return message.channel.send("해당 코드를 찾을 수 없습니다.");
				}
				if (gradeCode.is_used) {
					return message.channel.send("해당 코드는 이미 사용되었습니다.");
				}
				await pointAdd(message.author, gradeCode.price);
				gradeCode.is_used = new Date();
				gradeCode.user_id = message.author.id;
				await gradeCode.save();
				const { point } = await getUserInfo(message.author);
				message.channel.send(`코드 **${codeInput}** 가 성공적으로 사용 처리되었습니다.\n 현재 포인트 ${point}`);
			} catch (error) {
				console.error("코드사용 명령어 오류:", error);
				message.channel.send("코드 사용 처리 중 오류가 발생했습니다.");
			}
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.DeafenMembers
};

/**
 * 
 * @param {User} user 
 * @param {Number} point 
 */
async function pointAdd(user, point) {
	try {
		const { id } = user;
		let findOnde = await UserDb.findOne({ where: { user_id: id } });
		if (!findOnde) {
			const now = new Date();
			await UserDb.upsert(
				{
					user_id: id,
					name: username,
					auth_token: null,    // 필요하다면 토큰 할당
					last_play_date: null,
					last_online: now,
					created_at: now,
					grade: USER_PERMISSION.NONE,
					point,
				}
			);
			return true;
		}
		console.log("find one ,", findOnde);
		await findOnde.update({
			point: findOnde.point + point
		});
		return true;

	} catch (error) {
		console.log("point add error ", error.stack);
	}

}