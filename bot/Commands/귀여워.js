// commands/귀여워.js - Music Player v4.0
const { Client, Message, CommandInteraction, SlashCommandBuilder, PermissionFlagsBits, User, Guild } = require('discord.js');
const MusicPlayerV4 = require('./utility/v4/MusicPlayerV4');

const nameOfCommand = "귀여워";
const description = "음악 플레이어 v4.0";

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
				
				// v4.0 시스템에 메시지 할당
				const musicData = client.serverMusicData?.get(guild.id);
				if (musicData) {
					musicData.interactionMsg = msg;
					console.log(`[Music Player v4.0] Message assigned to controller`);
				}
			} else {
				await interaction.editReply({ content: "에러 발생. 관리자에게 문의해 주세요", ephemeral: true });
			}
		} catch (e) {
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
					
					// v4.0 시스템에 메시지 할당
					const musicData = client.serverMusicData?.get(guild.id);
					if (musicData) {
						musicData.interactionMsg = msg;
						console.log(`[Music Player v4.0] Message assigned to controller (prefix)`);
					}
				} else {
					await message.channel.send({ content: "에러 발생. 관리자에게 문의해 주세요", ephemeral: true });
				}
			} catch (e) {
				console.log(e.stack);
				await message.reply({ content: `${e}\nprefix musicplayer logic root error` });
			}
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator,
	isCacheCommand: true,
};

/**
 * 음악 플레이어 로직 v4.0
 * @param {Client} client   
 * @param {Guild} guild
 * @param {User} user 
 * @returns 
 */
async function musicLogic(client, guild, user) {
	const guildId = guild.id;

	console.log(`[Music Player v4.0] Starting for guild: ${guildId}`);
	
	// v4.0 시스템 초기화
	if (!client.serverMusicData) {
		client.serverMusicData = new Map();
	}

	let musicData = null;
	
	// 기존 플레이어 확인
	if (!client.serverMusicData.has(guildId)) {
		console.log(`[Music Player v4.0] Creating new player`);
		
		try {
			// v4.0 플레이어 생성
			musicData = new MusicPlayerV4(guildId, client, user);
			client.serverMusicData.set(guildId, musicData);
			
			// 초기 플레이리스트 로드
			const loaded = await musicData.queue.loadFromSource('youtube');
			if (!loaded) {
				console.warn(`[Music Player v4.0] No playlist loaded, but continuing with empty queue`);
			}
			
			// 사용자가 음성채널에 있으면 자동 접속
			if (user?.voice?.channel) {
				console.log(`[Music Player v4.0] User in voice channel, auto-connecting...`);
				try {
					await musicData.audio.connectToVoice(user);
					console.log(`[Music Player v4.0] Auto-connected to voice channel: ${user.voice.channel.name}`);
				} catch (error) {
					console.warn(`[Music Player v4.0] Auto-connect failed (continuing):`, error);
				}
			}
			
			console.log(`[Music Player v4.0] New player created for guild: ${guildId}`);
		} catch (error) {
			console.error(`[Music Player v4.0] Failed to create player:`, error);
			// 실패한 플레이어 제거
			if (client.serverMusicData.has(guildId)) {
				client.serverMusicData.delete(guildId);
			}
			return null;
		}
	} else {
		console.log(`[Music Player v4.0] Using existing player`);
		musicData = client.serverMusicData.get(guildId);
		
		// 사용자 정보 업데이트
		if (musicData.user !== user) {
			musicData.user = user;
		}
	}

	// 상태 확인
	const health = musicData.healthCheck();
	console.log(`[Music Player v4.0] Health check:`, health);

	try {
		// UI 컴포넌트 생성
		const replyData = await musicData.reply();
		
		// 플레이어 정보 로그
		const fullState = musicData.getFullState();
		
		console.log(`[Music Player v4.0] Generated UI:`, {
			state: fullState.isPlaying ? 'playing' : 'idle',
			currentTrack: fullState.currentTrack?.title || 'None',
			queueLength: fullState.queue.length,
			mode: fullState.mode,
			source: fullState.queue.source
		});
		
		return replyData;
		
	} catch (error) {
		console.error(`[Music Player v4.0] UI generation failed:`, error);
		
		// 에러 발생 시 플레이어 재생성 시도
		try {
			console.log(`[Music Player v4.0] Attempting player recovery...`);
			
			// 기존 플레이어 정리
			if (musicData) {
				await musicData.destroy();
			}
			
			// 새 플레이어 생성
			musicData = new MusicPlayerV4(guildId, client, user);
			client.serverMusicData.set(guildId, musicData);
			
			const loaded = await musicData.queue.loadFromSource('youtube');
			if (!loaded) {
				console.warn(`[Music Player v4.0] Recovery: No playlist loaded, but continuing with empty queue`);
			}
			
			const replyData = await musicData.reply();
			console.log(`[Music Player v4.0] Player recovery successful`);
			
			return replyData;
			
		} catch (recoveryError) {
			console.error(`[Music Player v4.0] Player recovery failed:`, recoveryError);
			client.serverMusicData.delete(guildId);
			return null;
		}
	}
}