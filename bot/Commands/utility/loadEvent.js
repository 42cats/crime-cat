// utils/loadEvents.js
const fs = require('fs');
const path = require('path');

/**
 * ./Events/{카테고리}/{파일} 구조의 이벤트들을 client.events 에 등록하고 실제 Discord 이벤트 리스너로도 등록
 * @param {import('discord.js').Client} client
 * @param {string} eventsDir - 예: './Events'
 */
function loadEvents(client, eventsDir) {
	client.events = new Map();

	const folders = fs.readdirSync(eventsDir, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	for (const folder of folders) {
		const files = fs.readdirSync(path.join(eventsDir, folder)).filter(file => file.endsWith('.js'));

		for (const file of files) {
			const event = require(path.join(eventsDir, folder, file));
			if (!client.events.has(event.name)) {
				console.log(`✅ 이벤트 등록됨: ${event.name}`);
				client.events.set(event.name, event);
				
				// 실제 Discord 이벤트 리스너로 등록
				if (event.once) {
					client.once(event.name, (...args) => event.execute(...args));
					console.log(`   📍 일회성 이벤트 리스너 등록: ${event.name}`);
				} else {
					client.on(event.name, (...args) => event.execute(...args));
					console.log(`   🔄 반복 이벤트 리스너 등록: ${event.name}`);
				}
			}
		}
	}
}

module.exports = { loadEvents };
