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
			// v3 플레이리스트 캐시 갱신
			// updatePlayer 함수에서 처리

			const msg = await interaction.reply({ 
				content: `${data.message}\n${data.title} 삭제됨\n🔄 음악 플레이어 목록이 자동으로 업데이트되었습니다.`, 
				ephemeral: true 
			});
			
			// 플레이어가 활성화된 경우 캐시 초기화 및 업데이트 (v1.0 호환)
			updatePlayer(interaction.client, guildId);
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

/**
 * v4 음악 플레이어 업데이트
 */
async function updatePlayer(client, guildId) {
	try {
		const { MusicSystemAdapter } = require('./utility/MusicSystemAdapter');
		await MusicSystemAdapter.refreshPlaylist(client, guildId, 'youtube');
		console.log('[주소삭제 v4] 플레이어 업데이트 완료');
	} catch (error) {
		console.warn('[주소삭제 v4] 플레이어 업데이트 실패 (무시됨):', error);
	}
}
