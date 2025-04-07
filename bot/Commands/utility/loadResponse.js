const fs = require('fs');
const path = require('path');

/**
 * Response 폴더 구조를 탐색하여 client.responses에 자동 등록하는 함수
 * @param {import('discord.js').Client} client - Discord 클라이언트
 * @param {string} baseDir - Response 루트 폴더 절대 경로 (예: path.join(__dirname, 'Response'))
 */
function loadResponses(client, baseDir) {
	if (!client.responses) client.responses = {};

	// Response/{폴더명} 구조 순회
	const responseTypes = fs.readdirSync(baseDir, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	for (const type of responseTypes) {
		const dirPath = path.join(baseDir, type);
		const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));

		const key = type.toLowerCase();
		client.responses[key] = new Map();

		for (const file of files) {
			const response = require(path.join(dirPath, file));
			if (!response.name) {
				console.warn(`⚠️ [${type}/${file}] name 속성이 없어 등록되지 않았습니다.`);
				continue;
			}
			client.responses[key].set(response.name, response);
		}
	}
}

module.exports = { loadResponses };
