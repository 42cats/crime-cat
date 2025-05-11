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
		.addSubcommand(subcommand =>
			subcommand
				.setName('단일')
				.setDescription('단일 버튼 그룹을 불러옵니다')
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
					option.setName('몇번눌렀어')
						.setDescription('누가 몇 번 눌렀는지 표시할까요? (기본값: false)'))
				.addBooleanOption(option =>
					option.setName('색변경')
						.setDescription('버튼을 누르면 전체 버튼 색깔이 바뀌도록 할까요? (기본값: false)'))
				.addBooleanOption(option =>
					option.setName('디엠으로')
						.setDescription('버튼을 누르면 해당정보를 누른 사람의 디엠으로 전송할까요? (기본값: false)'))
				.addBooleanOption(option =>
					option.setName('나만보기')
						.setDescription('버튼을 누르면 누른 사람에게만 보이도록 할까요? (기본값: false)'))
				.addBooleanOption(option =>
					option.setName('누름표시')
						.setDescription('버튼을 누르면 누른 사람의 이름이 해당버튼에 표기됨 (기본값: false)'))
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('멀티')
				.setDescription('여러 버튼 그룹을 불러옵니다 (쉼표로 구분)')
				.addStringOption(option =>
					option.setName('groupnames')
						.setDescription('버튼 그룹 이름들을 쉼표로 구분하여 입력하세요')
						.setRequired(true))
				.addBooleanOption(option =>
					option.setName('한번만')
						.setDescription('버튼을 1회만 누를 수 있도록 제한할까요? (기본값: false)'))
				.addBooleanOption(option =>
					option.setName('관리자만')
						.setDescription('길드 관리자만 버튼을 누를 수 있도록 제한할까요? (기본값: false)'))
				.addBooleanOption(option =>
					option.setName('몇번눌렀어')
						.setDescription('누가 몇 번 눌렀는지 표시할까요? (기본값: false)'))
				.addBooleanOption(option =>
					option.setName('색변경')
						.setDescription('버튼을 누르면 전체 버튼 색깔이 바뀌도록 할까요? (기본값: false)'))
				.addBooleanOption(option =>
					option.setName('디엠으로')
						.setDescription('버튼을 누르면 해당정보를 누른 사람의 디엠으로 전송할까요? (기본값: false)'))
				.addBooleanOption(option =>
					option.setName('나만보기')
						.setDescription('버튼을 누르면 누른 사람에게만 보이도록 할까요? (기본값: false)'))
				.addBooleanOption(option =>
					option.setName('누름표시')
						.setDescription('버튼을 누르면 누른 사람의 이름이 해당버튼에 표기됨 (기본값: false)'))
		),

	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	async execute(interaction) {
		// 서브커맨드 확인
		const subcommand = interaction.options.getSubcommand();

		// 옵션 가져오기
		const isOneTime = interaction.options.getBoolean('한번만') ?? false;
		const isAdminOnly = interaction.options.getBoolean('관리자만') ?? false;
		const showPressDetail = interaction.options.getBoolean('몇번눌렀어') ?? false;
		const changeColor = interaction.options.getBoolean('색변경') ?? false;
		const toDm = interaction.options.getBoolean('디엠으로') ?? false;
		const showOnlyMe = interaction.options.getBoolean('나만보기') ?? false;
		const labelName = interaction.options.getBoolean('누름표시') ?? false;

		// 멀티 모드 여부 판단 (서브커맨드에 따라 결정)
		const isMulti = subcommand === '멀티';

		// 권한 확인 로직
		if (!await isPermissionHas(interaction.user.id, "메시지매크로")) {
			interaction.reply("해당 기능을 사용할 권한이 없습니다. 권한을 구매해 주세요");
			return;
		}

		// 옵션 충돌 체크
		if (toDm && showOnlyMe) {
			return await interaction.reply({
				content: "❌ '디엠으로'와 '나만보기'는 동시에 사용할 수 없습니다. 둘 중 하나만 선택해주세요.",
				ephemeral: true
			});
		}
		if (!isOneTime && labelName) {
			return await interaction.reply({
				content: "❌ '버튼에 이름표시'는 '한번만'과 같이 사용해야 합니다.",
				ephemeral: true
			});
		}

		try {
			// 서브커맨드에 따른 처리
			if (subcommand === '단일') {
				const groupName = interaction.options.getString('groupname');
				await handleSingleGroup(interaction, groupName, {
					isOneTime, isAdminOnly, showPressDetail, changeColor, toDm, showOnlyMe, labelName, isMulti
				});
			} else if (subcommand === '멀티') {
				const groupNamesStr = interaction.options.getString('groupnames');
				const groupNames = groupNamesStr.split(',').map(name => name.trim()).filter(Boolean);

				if (groupNames.length === 0) {
					return await interaction.reply({ content: '❌ 유효한 그룹명을 입력해주세요.', ephemeral: true });
				}

				await handleMultipleGroups(interaction, groupNames, {
					isOneTime, isAdminOnly, showPressDetail, changeColor, toDm, showOnlyMe, labelName, isMulti
				});
			}
		} catch (error) {
			console.error("버튼 명령어 에러", error);
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({ content: `❌ 오류: ${String(error)}` });
			} else {
				await interaction.followUp({ content: `❌ 오류: ${String(error)}`, ephemeral: true });
			}
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

/**
 * 단일 그룹 처리 함수
 * @param {import('discord.js').CommandInteraction} interaction 
 * @param {string} groupName 
 * @param {Object} options 
 */
async function handleSingleGroup(interaction, groupName, options) {
	try {
		// 그룹 데이터 가져오기
		const group = await getButtons(interaction.guildId, groupName);

		if (!group || !Array.isArray(group.buttons) || group.buttons.length === 0) {
			return await interaction.reply({
				content: `❌ [${groupName}] 그룹에 버튼이 없습니다.`,
				ephemeral: true
			});
		}

		// 버튼 그룹 전송
		await sendButtonGroupWithPagination(interaction, group, options);
	} catch (error) {
		console.error("버튼 명령어 에러", error);
		if (!interaction.replied) {
			await interaction.reply({ content: `❌ 오류: ${String(error)}` });
		} else {
			await interaction.followUp({ content: `❌ 오류: ${String(error)}`, ephemeral: true });
		}
	}
}

/**
 * 여러 그룹 처리 함수
 * @param {import('discord.js').CommandInteraction} interaction 
 * @param {string[]} groupNames 
 * @param {Object} options 
 */
async function handleMultipleGroups(interaction, groupNames, options) {
	const { showPressDetail } = options;
	let statsMessageId = null;

	try {
		// 통계 메시지 생성 (showPressDetail 옵션이 켜져 있을 경우에만)
		if (showPressDetail) {
			const statsMessage = await createStatsMessage(interaction, groupNames);
			statsMessageId = statsMessage.id;
		} else {
			// 통계 옵션이 없으면 초기 응답 지연
			await interaction.deferReply();
		}

		// 각 그룹별로 처리하고 결과 모으기
		let successGroups = 0;
		let failedGroups = 0;

		for (const groupName of groupNames) {
			try {
				// 그룹 데이터 가져오기
				const group = await getButtons(interaction.guildId, groupName);

				if (!group || !Array.isArray(group.buttons) || group.buttons.length === 0) {
					await interaction.followUp({
						content: `❌ [${groupName}] 그룹에 버튼이 없습니다.`,
						ephemeral: true
					});
					failedGroups++;
					continue;
				}

				// 버튼 그룹 전송 (통계 메시지 ID 전달)
				await sendButtonGroupWithPagination(interaction, group, {
					...options,
					statsMessageId,
					followUp: true  // 항상 followUp 사용
				});

				successGroups++;
			} catch (groupError) {
				console.error(`그룹 [${groupName}] 처리 중 에러`, groupError);
				await interaction.followUp({
					content: `❌ [${groupName}] 그룹 처리 중 오류: ${String(groupError)}`,
					ephemeral: true
				});
				failedGroups++;
			}
		}

		// 완료 메시지 (통계 메시지를 이미 보냈을 경우에는 보내지 않음)
		if (!showPressDetail) {
			await interaction.followUp({
				content: `✅ 총 ${successGroups + failedGroups}개 그룹 중 ${successGroups}개 성공, ${failedGroups}개 실패`,
				ephemeral: true
			});
		}
	} catch (error) {
		console.error("버튼 명령어 에러", error);
		if (!interaction.replied && !interaction.deferred) {
			await interaction.reply({ content: `❌ 오류: ${String(error)}` });
		} else {
			await interaction.followUp({ content: `❌ 오류: ${String(error)}`, ephemeral: true });
		}
	}
}

/**
 * 통계 메시지 생성 함수
 * @param {import('discord.js').CommandInteraction} interaction 
 * @param {string[] | string} groupNames 
 * @returns {Promise<import('discord.js').Message>}
 */
async function createStatsMessage(interaction, groupNames) {
	// 배열을 문자열로 변환
	const groupNamesStr = Array.isArray(groupNames) ? groupNames.join(', ') : groupNames;

	// 통계 메시지 생성
	const message = await interaction.reply({
		content: `**버튼 통계** (${groupNamesStr})\n👤 누른 사람: 횟수`,
		fetchReply: true // 메시지 객체 반환
	});

	return message;
}

/**
 * 버튼들을 최대 5개씩 묶어 Row 배열로 만들고 전송
 * @param {import('discord.js').CommandInteraction} interaction
 * @param {{ name: string, buttons: Array<{ id: string, name: string, index: number }> }} group
 * @param {{ isOneTime: boolean, isAdminOnly: boolean, showPressDetail: boolean, changeColor: boolean, toDm: boolean, showOnlyMe: boolean, labelName: boolean, isMulti: boolean, statsMessageId: string, followUp: boolean }} options
 */
async function sendButtonGroupWithPagination(interaction, group, options = {}) {
	const { name: groupName, buttons } = group;
	const {
		isOneTime = false,
		isAdminOnly = false,
		showPressDetail = false,
		changeColor = false,
		toDm = false,
		showOnlyMe = false,
		labelName = false,
		isMulti = false,           // 추가: 멀티 모드 여부
		statsMessageId = null,     // 추가: 통계 메시지 ID
		followUp = false           // 추가: followUp 사용 여부
	} = options;

	const rows = [];

	for (let i = 0; i < buttons.length; i += 5) {
		const slice = buttons.slice(i, i + 5);
		const row = new ActionRowBuilder();

		for (const button of slice) {
			// 옵션 비트에 멀티 모드 여부 추가
			const optionBits = `${+isOneTime}${+isAdminOnly}${+showPressDetail}${+changeColor}${+toDm}${+showOnlyMe}${+labelName}${+isMulti}`;

			// 멀티 모드이고 통계 기능이 켜져 있을 때만 통계 메시지 ID 전달
			let customId;
			if (isMulti && showPressDetail && statsMessageId) {
				customId = encodeToString(button.id, "messageMacro", optionBits, statsMessageId);
			} else {
				customId = encodeToString(button.id, "messageMacro", optionBits);
			}

			row.addComponents(
				new ButtonBuilder()
					.setCustomId(customId)
					.setLabel(button.name)
					.setStyle(ButtonStyle.Primary)
			);
		}

		rows.push(row);
	}

	const content = `**${groupName}** 그룹 버튼입니다.`;

	if (followUp) {
		await interaction.followUp({
			content: content,
			components: rows
		});
	} else {
		await interaction.reply({
			content: content,
			components: rows
		});
	}
}