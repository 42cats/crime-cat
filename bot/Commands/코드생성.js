const { SlashCommandBuilder } = require('discord.js');
const { createCoupon } = require('./api/coupon/coupon');

const nameOfCommand = "코드생성";
const description = "개발자 전용: 등급업 쿠폰 코드 생성";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addIntegerOption(option =>
			option.setName('가격')
				.setDescription('쿠폰당 포인트')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('수량')
				.setDescription('생성할 쿠폰 개수 (기본: 1)')
				.setRequired(false))
		.addIntegerOption(option =>
			option.setName('기간')
				.setDescription('쿠폰 유효기간 (일, 기본: 28일)')
				.setRequired(false)),

	async execute(interaction) {
		// 개발자 확인
		if (interaction.user.id !== "317655426868969482") {
			return await interaction.reply({ content: '⛔ 이 명령어는 개발자 전용입니다.', ephemeral: true });
		}

		const price = interaction.options.getInteger('가격');
		const count = interaction.options.getInteger('수량') ?? 1;
		const duration = interaction.options.getInteger('기간') ?? 28;

		try {
			const msg = await getCoupons(price, count, duration);
			await interaction.reply({ content: `📦 생성된 쿠폰 코드 목록:\n\n${msg}`, ephemeral: true });
		} catch (error) {
			console.error("❌ 코드 생성 실패:", error);
			await interaction.reply({ content: '❌ 쿠폰 생성 중 오류가 발생했습니다.', ephemeral: true });
		}
	},

	upload: true,
	permissionLevel: -1
};

async function getCoupons(value, count, duration = 28) {
	const data = await createCoupon(value, count, duration);
	if (!data?.coupons)
		return data.message;

	const codeList = data.coupons.map((data, index) => {
		return `${index + 1}. \`\`\`${data.code}\`\`\`💰 **${data.point}P** / 📅 **${String(data.expireDate).slice(0, 10)}**`;
	}).join('\n');

	return codeList;
}
