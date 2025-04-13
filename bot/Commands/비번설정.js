const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, Message } = require('discord.js');
const { addChannelMessage } = require('./api/channel/channel');
const { encodeToString } = require('./utility/delimiterGeter');
const nameOfCommand = "비번설정";
const description = "유저가 비번을 맞출때 해당채널에 나올 메시지를 설정합니다.";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		,

	async execute(interaction) {
		const modal = new ModalBuilder()
			.setCustomId(encodeToString(interaction.guildId, "passwordNote", interaction.channel.id))
			.setTitle('비번사용시 출력된 메시지 저장');
		const inputPassword = new TextInputBuilder()
			.setCustomId(encodeToString(interaction.guildId, "privatePassword", interaction.channel.id, "password"))
			.setLabel(`설정할 비밀번호를 입력해주세요`)
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setMaxLength(2000)
			.setMinLength(1)
			.setPlaceholder(`${interaction.channel.name} 채널에 해당비밀번호를 !비번 해당비밀번호 로 맞출시 아래 내용이 출력 됩니다.`)
			;

		const inputContent = new TextInputBuilder()
			.setCustomId(encodeToString(interaction.guildId, "privateMessage", interaction.channel.id, "content"))
			.setLabel(`${interaction.channel.name} 에 출력될 내용을 입력해주세요`)
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setMaxLength(2000)
			.setMinLength(1)
			.setPlaceholder(`${interaction.channel.name} 채널에 비밀번호를 맞출때 해당 내용이 출력 됩니다.`)
			;

			const rowPassword = new ActionRowBuilder().addComponents(inputPassword);
			const rowContent = new ActionRowBuilder().addComponents(inputContent);
			modal.addComponents(rowPassword, rowContent);
			
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
