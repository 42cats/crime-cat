// commands/ping.js
const { Client, Message, CommandInteraction, SlashCommandBuilder, PermissionFlagsBits, User, Guild, ApplicationEmoji } = require('discord.js');
const { GuildURLManager } = require('./utility/UrlManager');
const { USER_PERMISSION, getUserGrade, showPermisson } = require('./utility/UserGrade');
// dotenv.config();
// const prefix = process.env.PRIFIX;

const nameOfCommand = "귀여워";
const description = "음악 플레이어";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	,
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const guild = interaction.guild;
		const user = interaction.member;
		const client = interaction.client;
		await interaction.deferReply();
		try {
			const replyData = await musicLogic(client, guild, user);
			if (replyData) {
				const msg = await interaction.editReply(replyData);
				const musicData = await client.serverMusicData.get(guild.id);
				musicData.interactionMsg = msg;
			}
			else
				await interaction.editReply({ content: "에러 발생. 관리자에게 문의해 주세요", ephemeral: true });
		}
		catch (e) {
			console.log(e.stack);
			if (interaction.isRepliable()) {
				interaction.editReply({
					content: `에러 ${e}\ninteraction musicplayer logic root error`,
					ephemeral: true,
				});
			}
			return;
		}
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		/**
		 *
		 * @param {Message} message 
		 * @param {*} args 
		 * @returns 
		 */
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
			const user = message.member;
			const guild = message.guild;
			const client = message.client;
			try {
				const replyData = await musicLogic(client, guild, user);
				if (replyData) {
					const msg = await message.channel.send(replyData);
					const musicData = await client.serverMusicData.get(guild.id);
					musicData.interactionMsg = msg;
				}
				else
					await message.channel.send({ content: "에러 발생. 관리자에게 문의해 주세요", ephemeral: true });
			}
			catch (e) {
				console.log(e.stack);
				await message.reply({ content: `${e}\nprefix musicplayer logic root error` });
			}
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

/**
 *
 * @param {Client} client   
 * @param {Guild} guild
 * @param {User} user 
 * @returns 
 */
async function musicLogic(client, guild, user) {
	const guildId = guild.id;

	let musicData = null;
	if (!client.serverMusicData.has(guildId)) {
		musicData = new GuildURLManager(guildId, client, user); 
		await client.serverMusicData.set(guildId, musicData);
	}
	else{
		musicData = client.serverMusicData.get(guildId);
	}
	await musicData.playlistManager.refresh();
	await musicData.audioPlayerManager.join(musicData.operater);
	const componentData = await musicData.reply();
	if (componentData)
		return componentData;
	else
		return null;
}