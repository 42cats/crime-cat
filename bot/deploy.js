const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');

dotenv.config();
const commands = [];
const foldersPath = path.join(__dirname, 'Commands');
const entries = fs.readdirSync(foldersPath, { withFileTypes: true });
for (const entry of entries) {
	const entryPath = path.join(foldersPath, entry.name);

	if (entry.isFile() && entry.name.endsWith('.js')) {
		// 파일일 경우: 해당 파일을 바로 명령어로 로드
		const command = require(entryPath);
		if ('data' in command && 'execute' in command && command.upload) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${entryPath} is missing a required "data" or "execute" property.`);
		}
	}
}

// 나머지 부분은 동일
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/)  commands.`);
		// console.log(commands);
		const data = await rest.put(
			Routes.applicationCommands(process.env.APP_ID),
			{ body: commands },
		);

		// console.log('data: ', data);
		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
