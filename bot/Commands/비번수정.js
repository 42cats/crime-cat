const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,} = require('discord.js');
const { addChannelMessage } = require('./api/channel/channel');
const { deletePasswordContent, matchPasswordContent } = require('./api/passwordNote/passwordNote');
const { encodeToString } = require('./utility/delimiterGeter');
const nameOfCommand = "비번수정";
const description = "설정한 비밀번호 컨텐츠를 수정합니다.";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName("비밀번호")
			.setDescription("패스워드 설정 수정, 수정할 채널에서 써주세요")
			.setRequired(true)
			.setAutocomplete(true)
		)
		,
		/**
		 * 
		 * @param {import('discord.js').CommandInteraction} interaction 
		*/
		async execute(interaction) {
		try{
		const passwordKey = interaction.options.getString('비밀번호');
		const data = await matchPasswordContent(interaction.guildId,passwordKey);
		const modal = new ModalBuilder()
			.setCustomId(encodeToString(interaction.guildId, "passwordNoteEdit", interaction.channel.id, data.uuid))
			.setTitle('비번사용시 출력된 메시지 저장');
		const inputPassword = new TextInputBuilder()
			.setCustomId(encodeToString(interaction.guildId, "privatePassword", interaction.channel.id, "password"))
			.setLabel(`설정할 비밀번호를 입력해주세요`)
			.setStyle(TextInputStyle.Paragraph)
			.setValue(data.passwordKey)
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
			.setValue(data.content)
			.setMaxLength(2000)
			.setMinLength(1)
			.setPlaceholder(`${interaction.channel.name} 채널에 비밀번호를 맞출때 해당 내용이 출력 됩니다.`)
			;
		const rowPassword = new ActionRowBuilder().addComponents(inputPassword);
		const rowContent = new ActionRowBuilder().addComponents(inputContent);
		modal.addComponents(rowPassword, rowContent);
			
		await interaction.showModal(modal);
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
			return await message.channel.send("``/비번수정`` 을 사용해주세요");
		}
	},


	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator, // 모든 유저 가능, 제한하려면 PermissionFlagsBits.Administrator 등으로 수정
	isCacheCommand: false,
};
