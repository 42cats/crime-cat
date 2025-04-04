const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.API_TOKEN;
const baseUrl = process.env.BASE_URL


/**
 * 
 * @param {User} param0 
 * @param {Guild} param1 
 */
async function addUserHistory({ id: userID }, { id: guildID }, characterName, isWin = false) {
	const API_URL = `${baseUrl}/v1/bot/histories`;  // 요청할 API 엔드포인트
	const body = {
		"guildSnowflake": guildID, // discord guild_id 
		"userSnowflake": userID,  // discord user_id
		"characterName": characterName
	}
	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		console.log('응답 데이터:', response.status, response.data);
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}

/**
 * @param {String} userId
 * @returns {Array} 유저 히스토리 배열 (없으면 빈 배열)
 */
async function getUserHistory(userId) {
	const API_URL = `${baseUrl}/v1/bot/histories/${userId}`;
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data?.userGameHistoryDtos || [];
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data || error.response.data.message);
		return []; // ✅ 에러 발생 시에도 항상 빈 배열 반환
	}
}

module.exports={
	addUserHistory,
	getUserHistory
}