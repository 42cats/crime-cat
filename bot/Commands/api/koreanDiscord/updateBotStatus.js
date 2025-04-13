const axios = require('axios');
const { Client } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BOT_TOKEN = process.env.KOREAN_DISCORD_TOKEN;
const BOT_ID = process.env.KOREAN_DISCORD_ID;

/**
 * 특정 유저가 해당 권한을 가지고 있는지 확인합니다.
 * @param {Client} client
 */
async function postBotStatus(client) {
	const serverCount = client.guilds.cache.size;
	const shardCount = client.shard?.count || 1;
	const API_URL = `https://koreanbots.dev/api/v2/bots/${BOT_ID}/stats`;
	const body = {
		"servers": serverCount,
		"shards": shardCount
	}
	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': BOT_TOKEN,
				'Content-Type': 'application/json'
			}
		});
		console.log('응답 데이터:', response.status);
		return response.status === 200;
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data);
		return false; // ✅ 반드시 false 반환
	}
}


module.exports = {
	postBotStatus
}