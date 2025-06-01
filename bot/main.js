const { Client, Events, GatewayIntentBits, ChannelType, Partials, PermissionFlagsBits } = require('discord.js');
const termsReply = require('./Commands/utility/termsSender');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
dotenv.config();
const prefix = process.env.PRIFIX;

// 연결 설정
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		// GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.DirectMessages,
	],
	partials: [Partials.Channel]
});

client.redis = require('./Commands/utility/redis');
(async () => {
	await client.redis.connect();

})();

const { loadResponses } = require('./Commands/utility/loadResponse');
loadResponses(client, path.join(__dirname, 'Response'));

let currentIndex = 0;
let messege = [];
const updateActivity = require("./Commands/utility/updateActivity");
const redisManager = require('./Commands/utility/redis');
const { initClientVariables } = require('./Commands/utility/clientVariables');
const { loadSlashAndPrefixCommands } = require('./Commands/utility/loadCommand');
const { loadEvents } = require('./Commands/utility/loadEvent');
const { guildAddProcess } = require('./Commands/api/guild/guild');

initClientVariables(client);
loadSlashAndPrefixCommands(client, path.join(__dirname, 'Commands'));
loadResponses(client, path.join(__dirname, 'Response'));
loadEvents(client, path.join(__dirname, 'Events'));

// It makes some properties non-nullable.
client.once(Events.ClientReady, async (readyClient) => {
	console.log(`Ready! Logged in as !!${readyClient.user.tag}`);
	updateActivity(client, messege, currentIndex);
	client.master = await client.users.fetch('317655426868969482');
});

client.on(Events.InteractionCreate, async (interaction) => {
	const event = client.events.get('interactionHandeleder');
	event?.execute(client, interaction);
});

// client.on(Events.MessageCreate, async (message) => {
// 	const event = client.events.get('MessageHandler');
// 	event?.execute(client, message);
// });


client.on(Events.GuildCreate, async (guild) => {
	try {
		// 캐시에서 대상 길드 가져오기
		const targetGuild = client.guilds.cache.get(guild.id);
		if (!targetGuild) return;

		// 오너 정보 가져오기
		const owner = await client.users.fetch(guild.ownerId);

		// 전송할 메시지 구성
		const payload = {
			type: 'NEW_GUILD_JOINED',
			guildId: guild.id,
			guildName: guild.name,
			memberCount: guild.memberCount,
			ownerId: guild.ownerId,
			ownerTag: owner?.tag ?? '알 수 없음',
			joinedAt: new Date().toISOString(),
		};

		// 마스터에게 전송
		client.master.send(payload);

		await guildAddProcess(client, targetGuild);
		client.master.send()
	}
	catch (err) {
		console.log(err.stack);
	}
});


client.on(Events.VoiceStateUpdate, (oldState, newState) => {
	if (client.events.has('voiceStateUpdate')) {
		const targetEvent = client.events.get('voiceStateUpdate');
		targetEvent.execute(oldState, newState);
	}
});
client.on(Events.GuildMemberAdd, async (member) => {
	const user = await member.guild.members.fetch(member.user.id);
	const targetEvent = client.events.get('GuildMemberAdd');
	targetEvent.execute(member);
});

client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
	const targetEvent = client.events.get('GuildUpdate');
	if (targetEvent) {
		targetEvent.execute(oldGuild, newGuild);
	}
});


const crypto = require('crypto');

const reportedErrors = [];
let pendingErrors = [];

function isAlreadyReported(hash) {
	return reportedErrors.includes(hash);
}

function addReportedHash(hash) {
	if (reportedErrors.length >= 10) {
		reportedErrors.shift();  // 가장 오래된 해시 제거
	}
	reportedErrors.push(hash);
}

process.on('uncaughtException', (err) => {
	console.error('[UNCAUGHT EXCEPTION]', err);

	const errorHash = crypto.createHash('md5').update(err.stack || String(err)).digest('hex');

	if (isAlreadyReported(errorHash)) {
		console.log('[INFO] 이미 보고된 오류, 재보고하지 않음.');
		return;
	}

	addReportedHash(errorHash);

	const message = `❗오류 발생:\n\`\`\`\n${err.stack || err.message || String(err)}\n\`\`\``;

	if (!global.client || !global.client.master) {
		console.log('[INFO] 마스터가 아직 초기화되지 않았습니다. 오류를 임시 저장합니다.');
		pendingErrors.push(message);
	} else {
		global.client.master.send({ content: message }).catch(console.error);
	}

	if (err.code === 50021) {
		console.log('[INFO] 시스템 메시지 관련 오류 무시');
		return;
	}

	console.log('[RECOVERY] 오류가 발생했지만 봇은 계속 실행됩니다.');

	try {
		const logDir = './logs';
		if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
		const logFile = `${logDir}/error-${new Date().toISOString().replace(/:/g, '-')}.log`;
		fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${err.stack || err}\n`);
	} catch (logError) {
		console.error('[LOGGING ERROR] 로그 기록 중 오류 발생:', logError);
	}
});

// 클라이언트 준비 완료 시 캐싱된 오류 전송
client.once(Events.ClientReady, async (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	if (pendingErrors.length > 0) {
		console.log(`[INFO] 초기화 전 발생한 오류 ${pendingErrors.length}개를 마스터에게 전송합니다.`);
		for (const errMsg of pendingErrors) {
			await client.master.send({ content: errMsg }).catch(console.error);
		}
		pendingErrors = [];
	}
});

// 처리되지 않은 Promise 거부 처리
process.on('unhandledRejection', (reason, promise) => {
	console.error('[UNHANDLED REJECTION] Promise 처리 실패:', reason);

	// Discord API 오류 처리
	if (reason && reason.code === 50021) {
		console.log('[INFO] 시스템 메시지 관련 API 오류입니다. 무시하고 계속 진행합니다.');
		return; // 프로세스 유지
	}

	// 오류 정보 출력 (디버깅용)
	console.error('[DEBUG] 거부된 Promise:', promise);
});

// 기존 handleExit 함수 수정 (이미 있는 경우)
// 기존 코드의 handleExit 함수를 수정하거나 아래 코드로 교체하세요
const handleExit = async (signal) => {
	console.log(`[EXIT] ${signal || 'exit'} 신호를 받았습니다. 봇 종료 준비 중...`);

	try {
		console.log('[EXIT] 데이터베이스 연결을 종료합니다...');
		client.master.send("봇 종료됨!!!");
		// v3 Music System 정리
		if (client && client.serverMusicData && client.serverMusicData.size > 0) {
			try {
				const { MusicSystemAdapter } = require('./Commands/utility/MusicSystemAdapter');
				await MusicSystemAdapter.cleanupAll(client);
				console.log('[EXIT] 모든 음악 플레이어가 정리되었습니다.');
			} catch (err) {
				console.error('[EXIT] 음악 플레이어 정리 중 오류:', err);
			}
		}

		// Redis 연결 종료 (있는 경우)
		if (client && client.redis) {
			try {
				await client.redis.disconnect();
				console.log('[EXIT] Redis 연결이 종료되었습니다.');
			} catch (redisErr) {
				console.error('[EXIT] Redis 연결 종료 중 오류:', redisErr);
			}
		}

		// 클라이언트 종료
		if (client) {
			console.log('[EXIT] 봇 연결 해제...');
			await client.destroy();
			console.log('[EXIT] 정상적으로 종료되었습니다.');
		}
	} catch (error) {
		console.error('[EXIT] 종료 과정에서 오류가 발생했습니다:', error);
	}
};

// 프로세스 종료 신호 처리
process.on('SIGINT', handleExit);     // Ctrl+C
process.on('SIGTERM', handleExit);    // Kill 명령어
process.on('exit', () => {
	console.log('[EXIT] 프로세스가 종료됩니다.');
});

// nodemon restart 처리 (SIGUSR2 신호)
process.once('SIGUSR2', () => {
	console.log('[NODEMON] 재시작 신호를 받았습니다.');
	handleExit('SIGUSR2').then(() => {
		// nodemon이 재시작할 수 있도록 원래 SIGUSR2 핸들러를 실행
		process.kill(process.pid, 'SIGUSR2');
	});
});
// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);