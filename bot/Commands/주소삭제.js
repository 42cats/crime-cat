const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const API = process.env.GOOGLE_API;
const { deleteGuildMusic } = require('./api/guild/music');

const nameOfCommand = "주소삭제";
const description = "유튜브 주소삭제";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option=>
			option
			.setName('타이틀')
			.setDescription('삭제할 타이틀을 선택하세요')
			.setRequired(true)
			.setAutocomplete(true)
		),

	async execute(interaction) {
		const guildId = interaction.guildId;
		const title = interaction.options.getString('타이틀');

		const data = await deleteGuildMusic(guildId, title);
		if (data) {
			const msg = await interaction.reply({ content: `${data.message}\n${data.title} 삭제됨`, ephemeral: true });
			return;
		}
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {

			await message.channel.send("\`\`\`/커맨드를 이용해 주세요 /주소삭제\`\`\`");
			return;	
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};
