
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const nameOfCommand = "권한업글";
const description = "포인트 사용으로 추가 권한 획득";

module.exports = {
	// 명령어 별칭(필요 시 추가)
	aliases: [],

	// Slash Command 등록 설정
	data: new SlashCommandBuilder()
		.setName(nameOfCommand) // 여기에 명령어 이름 입력 (예: spectate)
		.setDescription(description) // 여기에 명령어 설명 입력 (예: 참여했던 크씬에 관전자로 참가합니다.)
		// 예시 옵션 추가 (필요에 따라 옵션을 추가하거나 수정)
		.addStringOption(option =>
			option
				.setName('optionName') // 옵션 이름
				.setDescription('옵션에 대한 설명을 입력하세요')
				.setRequired(false) // 필요 시 true로 변경
				.setAutocomplete(false)
		),

	/**
	 * Slash Command 실행 함수
	 * @param {import('discord.js').CommandInteraction} interaction 
	 */
	async execute(interaction) {
		// 예시: 옵션 값 가져오기
		const optionValue = interaction.options.getString('optionName');

		// 여기서 명령어의 주요 로직을 구현합니다.
		// 필요에 따라 사용자 권한 체크, 데이터 처리, 메시지 전송 등을 수행합니다.
		// 예시: 단순 응답 메시지 전송
		await interaction.reply(`입력된 옵션 값: ${optionValue}`);
	},

	// (선택 사항) Prefix Command로 명령어 실행 시 사용할 로직
	prefixCommand: {
		name: nameOfCommand, // 동일하게 명령어 이름 입력
		description: description,
			async execute(message, args) {
			// Prefix Command 실행 로직 구현
			message.reply('Prefix Command 실행됨.');
		}
	},

	// 추가 설정: 파일 업로드 여부 및 필요한 권한 설정
	upload: true,
	permissionLevel: PermissionFlagsBits.SendMessages // 예시: 메시지 전송 권한 (필요에 따라 수정)
};
