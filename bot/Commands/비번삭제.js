const { SlashCommandBuilder, PermissionFlagsBits} = require('discord.js');
const { addChannelMessage } = require('./api/channel/channel');
const { deletePasswordContent } = require('./api/passwordNote/passwordNote');
const nameOfCommand = "비번삭제";
const description = "설정한 비밀번호 컨텐츠를 삭제합니다.";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName("비밀번호")
			.setDescription("삭제될 패스워드 키")
			.setRequired(true)
			.setAutocomplete(true)
		)
		,
		/**
		 * 
		 * @param {import('discord.js').CommandInteraction} interaction 
		 */
	async execute(interaction) {
		const passwordKey = interaction.options.getString('비밀번호');
		try {
			const msg = await deletePasswordContent(interaction.guildId, passwordKey);
			interaction.reply({content:`${msg}`});
		} catch (error) {
			interaction.reply({content: `${error}`});	
		}
	},

	/**
	 * 프리픽스 커맨드 (!기록)
	 * @param {Message} message 
	 */
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message) {
			return await message.channel.send("``/비번설정`` 을 사용해주세요");
			const filter = (m) => m.author.id === message.author.id;
			await message.channel.send('기록할 내용을 입력해주세요:');
			try {
				const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
				const input = collected.first().content;
				await addChannelMessage(message.guildId, message.channelId, input);
				await message.channel.send('✅ 메시지가 기록되었습니다.');
			} catch (e) {
				await message.channel.send('⛔ 시간이 초과되었거나 오류가 발생했습니다.');
			}
		}
	},


	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator, // 모든 유저 가능, 제한하려면 PermissionFlagsBits.Administrator 등으로 수정
};
