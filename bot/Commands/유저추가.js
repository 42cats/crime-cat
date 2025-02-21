// commands/ping.js
const { Client, Message, CommandInteraction, SlashCommandBuilder, PermissionFlagsBits, User, Guild } = require('discord.js');
const { GuildURLManager } = require('./utility/UrlManager');
const { USER_PERMISSION, getUserGrade } = require('./utility/UserGrade');
const { addUser } = require('./utility/discord_db');
// dotenv.config();
// const prefix = process.env.PRIFIX;

const nameOfCommand = "유저추가";
const description = "유저추가";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	,
	/**
	 * 
	 * @param {CommandInteraction} interaction가
	 */
	async execute(interaction) {
		const guild = interaction.guild;
		const user = interaction.member;
		const client = interaction.client;
		return;
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
			// const user = message.member;
			const guildId = message.guild;
			const client = message.client;
			const user = await client.users.fetch(args[0]);
			await addUser(user);
		}
	},
	upload: false,
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

	if (!client.serverMusicData.has(guildId)) {
		await client.serverMusicData.set(guildId, new GuildURLManager(guildId));
	}
	const musicData = client.serverMusicData.get(guildId);
	if (!musicData.operater || (musicData.operater !== user)) {
		musicData.operater = user;
		musicData.operaterGrade = await getUserGrade(user);
	}
	await musicData.playlistManager.refresh();
	await musicData.audioPlayerManager.join(musicData.operater);
	const componentData = await musicData.reply();
	if (componentData)
		return componentData;
	else
		return null;
}