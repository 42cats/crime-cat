const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} = require('discord.js');

const { getButtons } = require('./api/messageMacro/messageMacro');
const { encodeToString } = require('./utility/delimiterGeter');
const { isPermissionHas } = require('./api/user/permission');

const nameOfCommand = "버튼";
const description = "사이트에서 편집한 콘텐츠 불러오기";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName('groupname')
				.setDescription('버튼 그룹 이름을 입력하세요')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('한번만')
				.setDescription('버튼을 1회만 누를 수 있도록 제한할까요? (기본값: false)'))
		.addBooleanOption(option =>
			option.setName('관리자만')
				.setDescription('길드 관리자만 버튼을 누를 수 있도록 제한할까요? (기본값: false)'))
		.addBooleanOption(option =>
			option.setName('누가눌렀어')
				.setDescription('누가 몇 번 눌렀는지 표시할까요? (기본값: false)'))
		.addBooleanOption(option =>
			option.setName('색변경')
				.setDescription('버튼을 누르면 전체 버튼 색깔이 바뀌도록 할까요? (기본값: false)')),


	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	async execute(interaction) {
		const groupName = interaction.options.getString('groupname');
		const isOneTime = interaction.options.getBoolean('한번만') ?? false;
		const isAdminOnly = interaction.options.getBoolean('admin_only관리자만') ?? false;
		const showPressDetail = interaction.options.getBoolean('누가눌렀어') ?? false;
		const changeColor = interaction.options.getBoolean('색변경') ?? false;

		if (!await isPermissionHas(interaction.user.id, "버튼매크로")) {
			interaction.reply("해당 기능을 사용할 권한이 없습니다. 권한을 구매해 주세요");
		}
		try {
			const group = await getButtons(interaction.guildId, groupName);

			if (!group || !Array.isArray(group.buttons) || group.buttons.length === 0) {
				return await interaction.reply({
					content: `❌ [${groupName}] 그룹에 버튼이 없습니다.`,
					ephemeral: true
				});
			}

			await sendButtonGroupWithPagination(interaction, group, {
				isOneTime,
				isAdminOnly,
				showPressDetail,
				changeColor
			});
		} catch (error) {
			console.error("버튼 명령어 에러", error);
			await interaction.reply({ content: `❌ 오류: ${String(error)}` });
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

/**
 * 버튼들을 최대 5개씩 묶어 Row 배열로 만들고 전송
 * @param {import('discord.js').CommandInteraction} interaction
 * @param {{ name: string, buttons: Array<{ id: string, name: string, index: number }> }} group
 * @param {{ isOneTime: boolean, isAdminOnly: boolean, showPressDetail: boolean }} options
 */
async function sendButtonGroupWithPagination(interaction, group, options = {}) {
	const { name: groupName, buttons } = group;
	const {
		isOneTime = false,
		isAdminOnly = false,
		showPressDetail = false,
		changeColor = false
	} = options;

	const rows = [];

	for (let i = 0; i < buttons.length; i += 5) {
		const slice = buttons.slice(i, i + 5);
		const row = new ActionRowBuilder();

		for (const button of slice) {
			const optionBits = `${+isOneTime}${+isAdminOnly}${+showPressDetail}${+changeColor}`; // e.g. "101"
			const customId = encodeToString(button.id, "messageMacro", optionBits);

			row.addComponents(
				new ButtonBuilder()
					.setCustomId(customId)
					.setLabel(button.name)
					.setStyle(ButtonStyle.Primary)
			);
		}

		rows.push(row);
	}

	await interaction.reply({
		content: `**${groupName}** 그룹 버튼입니다.`,
		components: rows
	});
}
