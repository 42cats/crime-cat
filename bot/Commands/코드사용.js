const { SlashCommandBuilder, PermissionFlagsBits, User, Message } = require('discord.js');
const { redeemCoupon } = require('./api/coupon/coupon');
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
				.setDescription('사용할 \'-\'포함 36자리 코드를 입력하세요')
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
			const data = await redeemCoupon(interaction.user.id, codeInput);
			if (data?.message)
				return await interaction.reply({ content: `${data.message} \n현재 포인트 ${data.point}`, ephemeral: true });
			return await interaction.reply({ content: `${data}`, ephemeral: true });
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
				const data = await redeemCoupon(message.author.id, codeInput);
				if (data?.message)
					return await message.reply({ content: `${data.message} \n현재 포인트 ${data.point}`, ephemeral: true });
				return await message.reply({ content: `${data}`, ephemeral: true });
			} catch (error) {
				console.error("코드사용 명령어 오류:", error);
				message.channel.send("코드 사용 처리 중 오류가 발생했습니다.");
			}
		}
	},

	upload: false,
	permissionLevel: PermissionFlagsBits.DeafenMembers,
	isCacheCommand: false,
};
