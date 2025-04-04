/**
 * fileoverview 기본 명령어 템플릿 파일
 * 이 파일은 새 명령어 생성 시 기초 뼈대로 사용됩니다.
 * 사용 방법:
 * 1. 파일을 복사하여 새로운 명령어 파일로 저장합니다.
 * 2. COMMAND_NAME, DESCRIPTION, 옵션 이름 등 세부 항목을 수정합니다.
 * 3. execute 함수 안에 해당 명령어에 필요한 로직을 구현합니다.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCoupon } = require('./api/coupon/coupon');
const nameOfCommand = "코드생성";
const description = "등급업 코드 생성";
module.exports = {
	// 명령어 별칭(필요 시 추가)
	aliases: [],

	// Slash Command 등록 설정
	data: new SlashCommandBuilder()
		.setName(nameOfCommand) // 여기에 명령어 이름 입력 (예: spectate)
		.setDescription(description) // 여기에 명령어 설명 입력 (예: 참여했던 크씬에 관전자로 참가합니다.)
	// 예시 옵션 추가 (필요에 따라 옵션을 추가하거나 수정)
	,
	/**
	 * Slash Command 실행 함수
	 * @param {import('discord.js').Interaction} interaction 
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
		/**
		 * @param {} message
		 * @param {} args
		 */
		async execute(message, args) {
			try {
				// 관리자 권한 확인 (예: 특정 사용자 ID로 확인)
				if (message.author.id !== "317655426868969482") {
					return;
				}

				// 가격과 생성할 코드 수 설정
				let price = args[0] ? Number(args[0]) : 500;
				let count = args[1] ? Number(args[1]) : 1;
				let duration = args[2] ? Number(args[2]) : 28;
				const msg = await getCoupons(price,count,duration);
				message.channel.send(`생성된 고유 코드:\n${msg}`);
			} catch (error) {
				console.error("코드생성 명령어 오류:", error);
				message.channel.send("코드 생성 중 오류가 발생했습니다.");
			}
		}	
	}
	,

	// 추가 설정: 파일 업로드 여부 및 필요한 권한 설정
	upload: false,
	permissionLevel: PermissionFlagsBits.Administrator // 예시: 메시지 전송 권한 (필요에 따라 수정)
};

async function getCoupons(value, count, duration = 28) {
	const data = await createCoupon(value,count,duration);
	if(!data?.coupons)
		return data.message;
	const codeList = data.coupons.map((data, index) => {
		console.log(data);
		return`${index + 1}. \`\`\`${data.code}\`\`\`  price **${data.point}** duration **${String(data.expireDate).slice(0,10)}**`}).join('\n');
	return codeList
}