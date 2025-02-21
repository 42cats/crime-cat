const { Client, Events, GatewayIntentBits, ChannelType, Partials, PermissionFlagsBits } = require('discord.js');
const { processGuildAndUsersWithHistory, addUser } = require('./Commands/utility/discord_db');
const termsReply = require('./Commands/utility/termsSender');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
dotenv.config();
const prefix = process.env.PRIFIX;
const { USER_PERMISSION, getUserGrade, hasPermission } = require('./Commands/utility/UserGrade');

// 연결 설정
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.DirectMessages,
	],
	partials: [Partials.Channel]
});

client.redis = require("./Commands/utility/redis");
(async () => {
	// await client.redis.set('aa', "5");
	// await client.redis.set('bb', "4");
	// await client.redis.set('cc', "7");
	// await client.redis.set('dd', "6");
	// const data = await client.redis.get('aa');
	// console.log("redis = ", data);

})();

//music data map
client.serverMusicData = new Map();
client.slashCommands = new Map();
client.prefixCommands = new Map();
client.Events = new Map();
client.playEvent = new Map();
client.replyUserDm = null;
client.aliasesMap = new Map();
client.events = new Map();
client.voteStorage = new Map();
const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./Commands/${file}`);
	// 슬래시용
	client.slashCommands.set(command.data.name, command);
	// 프리픽스용
	// console.log(command);
	client.prefixCommands.set(command.data.name, command);
	command.aliases?.map(element => {
		client.aliasesMap.set(element, command.data.name);
	});
}

// ./Events 디렉토리의 모든 폴더 읽기
const folders = fs.readdirSync('./Events', { withFileTypes: true })
	.filter(dirent => dirent.isDirectory()) // 폴더만 선택
	.map(dirent => dirent.name);

for (const folder of folders) {
	const eventFiles = fs.readdirSync(`./Events/${folder}`).filter(file => file.endsWith('.js')); // 폴더 내 JS 파일 탐색

	for (const file of eventFiles) {
		const event = require(`./Events/${folder}/${file}`);
		if (!client.events.has(event.name)) {
			console.log("event save as ", event.name);
			client.events.set(event.name, event); // 이벤트 이름으로 저장
		}
	}
}
client.responses = {
	buttons: new Map(),
	selectMenus: new Map(),
	autoComplete: new Map(),
};

// 버튼 Response 로드
const buttonResponseFiles = fs.readdirSync('./Response/Buttons').filter(file => file.endsWith('.js'));
for (const file of buttonResponseFiles) {
	const response = require(`./Response/Buttons/${file}`);
	client.responses.buttons.set(response.name, response);
}

// 셀렉트 메뉴 Response 로드
const selectMenuResponseFiles = fs.readdirSync('./Response/SelectMenus').filter(file => file.endsWith('.js'));
for (const file of selectMenuResponseFiles) {
	const response = require(`./Response/SelectMenus/${file}`);
	client.responses.selectMenus.set(response.name, response);
}

// 자동완성 Response 로드
const autoCompleteResponseFiles = fs.readdirSync('./Response/Autocomplete').filter(file => file.endsWith('.js'));
for (const file of autoCompleteResponseFiles) {
	const response = require(`./Response/Autocomplete/${file}`);
	client.responses.autoComplete.set(response.name, response);
}




/////////






let currentIndex = 0;
let messege = [];
const updateActivity = require("./Commands/utility/updateActivity");
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

client.on(Events.MessageCreate, async (message) => {
	const event = client.events.get('MessageHandler');
	event?.execute(client, message);
});


client.on(Events.GuildCreate, async (guild) => {
	try {
		const list = [...client.guilds.cache.values()];
		const owner = await client.users.fetch(guild.ownerId);
		const tagetGuild = await client.guilds.cache.get(guild.id);
		const ownerGrade = await getUserGrade(owner);
		console.log("owner", ownerGrade, "  ");
		if (hasPermission(owner, USER_PERMISSION.ADD_GUILD_ABLE)) {
			await processGuildAndUsersWithHistory(client, tagetGuild);
			return;
		}
		const matchingGuilds = list.filter(v => v.ownerId === guild.ownerId);  // 일치하는 guild 객체들 필터링

		if (matchingGuilds.length >= 2) {
			console.log("이미 한 개 이상의 길드에 오너로 등록됨:", guild.ownerId, matchingGuilds);
			if (tagetGuild) {
				await tagetGuild.leave();
				if (owner.dmChannel) {
					await owner.send('이미 당신이 오너로 된 길드가 2개 이상 추가되어 있습니다. 협조 감사드립니다! :)');
				}
			}
			return;
		}
		console.log("약관 전송");
		termsReply.execute(client, owner, guild, 1);
		owner && await owner.send('짭냥이 개발에 협조해 주셔서 감사합니다 :)');
		// await processGuildAndUsersWithHistory(client, tagetGuild);
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