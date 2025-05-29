// utils/initClientVariables.js

/**
 * 기타 초기 client 변수 등록 - v2.0 Only
 * @param {import('discord.js').Client} client
 */
function initClientVariables(client) {
	client.serverMusicData = new Map(); // v2.0 Music Player
	client.playEvent = new Map();
	client.voteStorage = new Map();
	client.replyUserDm = null;
}

module.exports = { initClientVariables };
