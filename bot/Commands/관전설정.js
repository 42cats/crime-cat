const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, Role } = require('discord.js');
const { Guild, sequelize } = require('./utility/db');
const nameOfCommand = "관전설정";
const description = "길드에 관전역할 설정(투표및, 관전명령어에 사용됨)";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option
				.setName('수식어') // 문자열 옵션 이름
				.setDescription('예시) [관전] ') // 문자열 옵션 설명
				.setRequired(true) // 필수 옵션 여부
		)
		.addRoleOption(option =>
			option
				.setName('권한') // 역할 옵션 이름
				.setDescription('관전으로 등록할 역할을 선택하세요.') // 역할 옵션 설명
				.setRequired(true) // 필수 옵션 여부
		)
	,

	async execute(interaction) {
		const title = interaction.options.getString('수식어'); // 캐릭터이름 옵션 값 가져오기
		const role = interaction.options.getRole('권한'); // 권한 역할 옵션 값 가져오기
		console.log("role = ", role);
		const isAdd = await ObserverSet(interaction, { title, role });
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			/**
			 * 프리픽스 명령어 없음
			 */
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};



/**
 * 
 * @param {CommandInteraction} interaction 
 * @param {Object} param1 
 * @param {String} param1.title 
 * @param {Role} param1.role 
 */
async function ObserverSet(interaction, { title, role }) {
	const { guildId } = interaction;

	// 트랜잭션 생성
	const transaction = await sequelize.transaction();

	try {
		// 길드 찾기
		const guild = await Guild.findOne({ where: { guild_id: guildId }, transaction });

		if (!guild) {
			await transaction.rollback();
			return interaction.reply({ content: "해당 길드를 찾을 수 없습니다.", ephemeral: true });
		}

		// 데이터 업데이트
		await guild.update({ head_title: title, observer: role.id }, { transaction });

		// 트랜잭션 커밋
		await transaction.commit();
		return interaction.reply({ content: `관전 역할이 성공적으로 설정되었습니다.\ntitle: ${title}\n role: ${role?.name ? role.name : "설정 없음"}`, ephemeral: true });
	} catch (error) {
		// 오류 발생 시 롤백
		await transaction.rollback();
		console.error(error);
		return interaction.reply({ content: "관전 역할 설정 중 오류가 발생했습니다.", ephemeral: true });
	}
}