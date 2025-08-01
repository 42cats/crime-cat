const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, Message } = require('discord.js');
const { addChannelMessage } = require('./api/channel/channel');
const { encodeToString } = require('./utility/delimiterGeter');
const nameOfCommand = "기록";
const description = "문자열을 입력하고, 해당 내용을 채널에 저장합니다.";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description),

	async execute(interaction) {
		const modal = new ModalBuilder()
			.setCustomId(encodeToString(interaction.guildId,"recodeMessage",interaction.channel.id))
			.setTitle('채널에 메시지 기록');

		const input = new TextInputBuilder()
			.setCustomId(encodeToString(interaction.guildId,"recodeMessage",interaction.channel.id))
			.setLabel(`${interaction.channel.name} 에 기록할 내용을 입력해주세요`)
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setMaxLength(2000)
			.setMinLength(1)
			.setPlaceholder(`${interaction.channel.name} 채널에 기록됩니다.`)
			;

		const row = new ActionRowBuilder().addComponents(input);
		modal.addComponents(row);
		await interaction.showModal(modal);
	},

	/**
	 * 프리픽스 커맨드 (!기록)
	 * @param {Message} message 
	 */
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message) {
			return await message.channel.send("``/기록`` 을 사용해주세요");
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

	async modalHandler(interaction) {
		if (interaction.customId !== 'record_modal') return;
		const input = interaction.fields.getTextInputValue('record_input');
		const guildId = interaction.guildId;
		const channelId = interaction.channelId;

		try {
			await addChannelMessage(guildId, channelId, input);
			await interaction.reply({ content: '✅ 메시지가 성공적으로 기록되었습니다.', ephemeral: true });
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: '❌ 메시지 기록 중 오류가 발생했습니다.', ephemeral: true });
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator, // 모든 유저 가능, 제한하려면 PermissionFlagsBits.Administrator 등으로 수정
	isCacheCommand: false,
};
