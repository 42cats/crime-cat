const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, Role } = require('discord.js');
const { Guild, sequelize } = require('./utility/db');
const { addGuildObserverSet } = require('./api/guild/observer');
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

	const response = await addGuildObserverSet(guildId, title, role?.id);

	if (response?.status === 200) {
		const roleId = response.data.roleSnowflake;
		const foundRole = interaction.guild.roles.cache.get(roleId);
		
		console.log("찾은 역할 객체: ", foundRole);
		await interaction.reply(`관전설정 성공 ✅\n타이틀: ${response.data.headTitle}\n설정 역할: ${foundRole?.name || "없음"}`);
	} else {
		await interaction.reply(`❌ 관전설정 실패\n사유: ${response?.data?.message || "알 수 없는 오류"}`);
	}
}
