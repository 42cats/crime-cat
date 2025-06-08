const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} = require('discord.js');

const { encodeToString } = require('./utility/delimiterGeter');

const nameOfCommand = "체크";
const description = "장소와 구성요소를 체크할 수 있는 버튼 생성";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option.setName('장소목록')
				.setDescription('-{장소이름},[구성요소1],[구성요소2],... 형식으로 입력')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('한번만')
				.setDescription('버튼을 1회만 누를 수 있도록 제한할까요? (기본값: false)'))
		.addBooleanOption(option =>
			option.setName('몇번눌렀어')
				.setDescription('누가 몇 번 눌렀는지 표시할까요? (기본값: false)'))
		.addBooleanOption(option =>
			option.setName('누가눌렀어')
				.setDescription('버튼에 누른 사람 이름을 표시할까요? (한번만 옵션과 함께 사용, 기본값: false)'))
		.addBooleanOption(option =>
			option.setName('비밀')
				.setDescription('개인 채널에 체크 로그를 남길까요? (누가눌렀어와 함께 사용 불가, 기본값: false)')),

	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	async execute(interaction) {
		try {
			const input = interaction.options.getString('장소목록');

			// 옵션 가져오기 (기본값 false)
			const isOneTime = interaction.options.getBoolean('한번만') ?? false;
			const showPressDetail = interaction.options.getBoolean('몇번눌렀어') ?? false;
			const labelName = interaction.options.getBoolean('누가눌렀어') ?? false;
			const isSecret = interaction.options.getBoolean('비밀') ?? false;

			// 옵션 검증
			if (labelName && !isOneTime) {
				return await interaction.reply({
					content: '❌ "누가눌렀어" 옵션은 "한번만" 옵션과 함께 사용해야 합니다.',
					ephemeral: true
				});
			}


			if (isSecret && labelName) {
				return await interaction.reply({
					content: '❌ "비밀" 옵션과 "누가눌렀어" 옵션은 함께 사용할 수 없습니다.',
					ephemeral: true
				});
			}

			// 입력값 파싱
			const locations = parseLocations(input);

			if (locations.length === 0) {
				return await interaction.reply({
					content: '❌ 올바른 형식으로 입력해주세요. 예: -{장소이름},[구성요소1],[구성요소2]',
					ephemeral: true
				});
			}

			// 멀티 모드처럼 통계 메시지 먼저 생성 (showPressDetail 옵션이 true일 때만)
			let statsMessageId = null;

			if (showPressDetail) {
				const locationNames = locations.map(loc => loc.name).join(', ');
				const statsMessage = await interaction.reply({
					content: `**체크리스트** (${locationNames})\n📊 총 체크 횟수: 0회\n👤 체크한 항목: 개수`,
					fetchReply: true
				});
				statsMessageId = statsMessage.id;
			} else {
				// 통계 메시지 없이 시작
				await interaction.deferReply();
			}

			// 각 장소별로 메시지와 버튼 전송
			for (const location of locations) {
				await sendLocationButtons(interaction, location, {
					isOneTime,
					showPressDetail,
					labelName,
					isSecret,
					statsMessageId
				});
			}

			// 통계 메시지가 없을 때 완료 메시지
			if (!showPressDetail) {
				await interaction.followUp({
					content: `✅ 총 ${locations.length}개 장소의 체크리스트를 생성했습니다.`,
					ephemeral: true
				});
			}

		} catch (error) {
			console.error("체크 명령어 에러", error);
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({ content: `❌ 오류: ${String(error)}` });
			} else {
				await interaction.followUp({ content: `❌ 오류: ${String(error)}`, ephemeral: true });
			}
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.DeafenMembers
};

/**
 * 입력 문자열을 파싱하여 장소와 구성요소 배열로 변환
 * @param {string} input 
 * @returns {Array<{name: string, components: string[]}>}
 */
function parseLocations(input) {
	const locations = [];

	// 먼저 전체 문자열에서 모든 구성요소를 수집
	let remainingInput = input;
	let currentPosition = 0;

	while (currentPosition < remainingInput.length) {
		// -로 시작하는 새로운 장소 찾기
		const locationStart = remainingInput.indexOf('-', currentPosition);
		if (locationStart === -1) break;

		// 다음 장소 시작점 찾기 (없으면 문자열 끝까지)
		let nextLocationStart = remainingInput.indexOf(',-', locationStart + 1);
		if (nextLocationStart === -1) {
			nextLocationStart = remainingInput.length;
		}

		// 현재 장소 부분 추출
		const locationPart = remainingInput.substring(locationStart + 1, nextLocationStart);

		// 장소명 추출 (대괄호 없는 경우와 있는 경우 모두 처리)
		let locationName = '';
		let componentsStartIndex = 0;

		// -{장소명} 형식
		if (locationPart.startsWith('{')) {
			const endBracketIndex = locationPart.indexOf('}');
			if (endBracketIndex !== -1) {
				locationName = locationPart.substring(1, endBracketIndex).trim();
				componentsStartIndex = endBracketIndex + 1;
			}
		} else {
			// -장소명, 형식 (쉼표 전까지가 장소명)
			const firstCommaIndex = locationPart.indexOf(',');
			if (firstCommaIndex !== -1) {
				locationName = locationPart.substring(0, firstCommaIndex).trim();
				componentsStartIndex = firstCommaIndex;
			} else {
				// 쉼표가 없으면 전체가 장소명
				locationName = locationPart.trim();
				componentsStartIndex = locationPart.length;
			}
		}

		// 구성요소 추출
		const components = [];
		if (componentsStartIndex < locationPart.length) {
			const componentsStr = locationPart.substring(componentsStartIndex);

			// [내용] 형태를 우선적으로 찾기
			const bracketRegex = /\[([^\]]+)\]/g;
			let bracketMatch;
			let hasBrackets = false;

			while ((bracketMatch = bracketRegex.exec(componentsStr)) !== null) {
				const component = bracketMatch[1].trim();
				if (component) {
					components.push(component);
					hasBrackets = true;
				}
			}

			// 대괄호가 없는 경우 쉼표로 구분
			if (!hasBrackets) {
				const simpleComponents = componentsStr
					.split(',')
					.map(comp => comp.trim())
					.filter(Boolean);

				components.push(...simpleComponents);
			}
		}

		if (locationName && components.length > 0) {
			locations.push({
				name: locationName,
				components: components
			});
		}

		// 다음 위치로 이동
		currentPosition = nextLocationStart;
	}

	return locations;
}

/**
 * 장소별 버튼 그룹 전송
 * @param {import('discord.js').CommandInteraction} interaction 
 * @param {{name: string, components: string[]}} location 
 * @param {{isOneTime: boolean, showPressDetail: boolean, labelName: boolean, isSecret: boolean, statsMessageId: string}} options 
 */
async function sendLocationButtons(interaction, location, options) {
	const { isOneTime, showPressDetail, labelName, isSecret, statsMessageId } = options;
	const MAX_BUTTONS_PER_MESSAGE = 25; // Discord 최대 제한
	const BUTTONS_PER_ROW = 5;

	// 구성요소를 25개씩 묶어서 처리
	for (let messageIndex = 0; messageIndex < location.components.length; messageIndex += MAX_BUTTONS_PER_MESSAGE) {
		const messageComponents = location.components.slice(messageIndex, messageIndex + MAX_BUTTONS_PER_MESSAGE);
		const rows = [];

		// 버튼을 5개씩 묶어서 ActionRow 생성
		for (let i = 0; i < messageComponents.length; i += BUTTONS_PER_ROW) {
			const slice = messageComponents.slice(i, i + BUTTONS_PER_ROW);
			const row = new ActionRowBuilder();

			for (const component of slice) {
				// 옵션 비트 동적 생성
				// [0] 한번만
				// [1] 관리자만: 0 (항상 비활성화)
				// [2] 몇번눌렀어
				// [3] 색변경: 0 (항상 비활성화)
				// [4] 디엠으로: 0 (항상 비활성화)
				// [5] 나만보기: 0 (항상 비활성화)
				// [6] 누가눌렀어
				// [7] 멀티모드: 1 (항상 활성화 - 통계 메시지 업데이트를 위해)
				// [8] 역할옵션: 0 (항상 비활성화)
				// [9] 지정채널: 0 (항상 비활성화)
				// [10] 비밀 (새로 추가)
				const optionBits = `${+isOneTime}0${+showPressDetail}000${+labelName}100${+isSecret}`;

				// customId 생성: 구성요소명을 ID로 사용
				const customId = encodeToString(
					`${location.name}_${component}`, // 장소명_구성요소명을 고유 ID로 사용
					"checkButton", // 체크 버튼 전용 핸들러
					optionBits,
					statsMessageId // 통계 메시지 ID 전달
				);

				row.addComponents(
					new ButtonBuilder()
						.setCustomId(customId)
						.setLabel(component)
						.setStyle(ButtonStyle.Primary)
				);
			}

			rows.push(row);
		}

		// 메시지 제목 생성 (여러 메시지가 필요한 경우 번호 추가)
		const totalMessages = Math.ceil(location.components.length / MAX_BUTTONS_PER_MESSAGE);
		const currentMessageNumber = Math.floor(messageIndex / MAX_BUTTONS_PER_MESSAGE) + 1;

		let messageTitle;
		if (totalMessages > 1) {
			messageTitle = `**${location.name}** 체크리스트 (${currentMessageNumber}/${totalMessages})`;
		} else {
			messageTitle = `**${location.name}** 체크리스트`;
		}

		// 메시지 전송
		await interaction.followUp({
			content: messageTitle,
			components: rows
		});
	}
}