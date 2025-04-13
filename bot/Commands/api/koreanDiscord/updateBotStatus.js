const axios = require('axios');
const { Client } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BOT_TOKEN = process.env.KOREAN_DISCORD_TOKEN;
const BOT_ID = process.env.KOREAN_DISCORD_ID;

/**
 * 한국 디스코드 리스트에 서버 정보를 전송 
 * @param {Client} client
 */
async function postBotStatus(client) {
	const serverCount = client.guilds.cache.size송
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