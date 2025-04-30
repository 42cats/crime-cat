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



const handleExit = async (signal) => {
	console.log(`Received ${signal}. 봇 종료 준비 중...`);

	// 봇 종료 시 필요한 로직 추가
	try {
		// 예: DB 연결 종료
		console.log('데이터베이스 연결을 종료합니다...');
		for (const [key, value] of client.serverMusicData.entries()) {
			console.log(`서버 ID: ${key}`);
			value.destroy();
			console.log("접속중인 길드의 음성채널 캐쉬삭제 ", value.guildId);
		}
		console.log('봇 연결 해제... ');
		await client.destroy();
		console.log('정상적으로 종료되었습니다 .');
	} catch (error) {
		console.error('종료 과정에서 오류가 발생했습니다 :', error);
	} finally {
		process.exit(0);
	}
};

// 프로세스 종료 신호에 대한 이벤트 리스 너
process.on('SIGINT', handleExit);  // Ctrl+C
process.on('SIGTERM', handleExit); // Kill 명령어
process.on('exit', handleExit); // 그냥종료
process.once('SIGUSR2', handleExit.bind(this)); // nodemon restart시
// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);