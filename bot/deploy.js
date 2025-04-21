// deploy-commands.js
const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');

dotenv.config();

const globalCommands = [];
const guildCommands = [];

const foldersPath = path.join(__dirname, 'Commands');
const entries = fs.readdirSync(foldersPath, { withFileTypes: true });

for (const entry of entries) {
	const entryPath = path.join(foldersPath, entry.name);

	if (entry.isFile() && entry.name.endsWith('.js')) {
		const command = require(entryPath);

		if ('data' in command && 'execute' in command && command.upload) {
			// permissionLevel이 -1이면 특정 길드 전용
			if (command.permissionLevel === -1) {
				guildCommands.push(command.data.toJSON());
			} else {
				globalCommands.push(command.data.toJSON());
			}
		} else {
			console.warn(`[WARNING] ${entryPath}는 "data", "execute", "upload" 속성이 없어 등록하지 않습니다.`);
		}
	}
}

// 디스코드 REST API 인스턴스
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// 등록 실행 함수
(async () => {
	try {
		// 🔄 글로벌 등록
		if (globalCommands.length > 0) {
			console.log(`🌐 글로벌 커맨드 등록 중... (${globalCommands.length})`);
			const globalResult = await rest.put(
				Routes.applicationCommands(process.env.APP_ID),
				{ body: globalCommands }
			);
			console.log(`✅ 글로벌 커맨드 등록 완료: ${globalResult.length}개`);
		}

		// 🛡️ 길드 전용 등록
		if (guildCommands.length > 0) {
			const guildId = process.env.DEV_GUILD_ID; // .env에 등록된 개발용 서버 ID
			console.log(`🏠 길드(${guildId}) 전용 커맨드 등록 중... (${guildCommands.length})`);
			const guildResult = await rest.put(
				Routes.applicationGuildCommands(process.env.APP_ID, guildId),
				{ body: guildCommands }
			);
			console.log(`✅ 길드 전용 커맨드 등록 완료: ${guildResult.length}개`);
		}

		if (globalCommands.length === 0 && guildCommands.length === 0) {
			console.log("⚠️ 등록할 커맨드가 없습니다.");
		}
	} catch (error) {
		console.error("❌ 커맨드 등록 중 오류 발생:", error);
	}
})();
