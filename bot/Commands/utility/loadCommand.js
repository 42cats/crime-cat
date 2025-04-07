// utils/loadSlashAndPrefixCommands.js
const fs = require('fs');
const path = require('path');

/**
 * 슬래시 및 프리픽스 커맨드를 client에 등록
 * @param {import('discord.js').Client} client
 * @param {string} commandDir - 예: './Commands'
 */
function loadSlashAndPrefixCommands(client, commandDir) {
	client.slashCommands = new Map();
	client.prefixCommands = new Map();
	client.aliasesMap = new Map();

	const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const command = require(path.join(commandDir, file));
		client.slashCommands.set(command.data.name, command);
		client.prefixCommands.set(command.data.name, command);

		command.aliases?.forEach(alias => {
			client.aliasesMap.set(alias, command.data.name);
		});
	}
}

module.exports = { loadSlashAndPrefixCommands };
