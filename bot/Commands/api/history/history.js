const logger = require('../../utility/logger');
const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL


/**
 * 
 * @param {User} param0 
 * @param {Guild} param1
 * @param {string} characterName
 * @param {Date} createdAt   
 */
async function addUserHistory({ id: userID }, { id: guildID }, characterName, createdAt = null, isWin = false) {
	const API_URL = `${baseUrl}/bot/v1/histories/crime_scene`;  // 요청할 API 엔드포인트
	const body = {
		"guildSnowflake": guildID, // discord guild_id 
		"userSnowflake": userID,  // discord user_id
		"characterName": characterName,
	}
	if (createdAt)
		body.createdAt = createdAt;
	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		logger.info('유저히스토리 응답 데이터:', response.status, response.data);
	} catch (error) {
		logger.error('유저 히스토리 API 요청 실패:', error.response?.data || error.response?.data?.message);
	}
}

/**
 * @param {String} userId
 * @returns {Array} 유저 히스토리 배열 (없으면 빈 배열)
 */
async function getUserHistory(userId) {
	const API_URL = `${baseUrl}/bot/v1/histories/crime_scene/${userId}`;
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		logger.info('응답 데이터:', response.status, response.data);
		return response.data?.userGameHistoryDtos || [];
	} catch (error) {
		logger.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return []; // ✅ 에러 발생 시에도 항상 빈 배열 반환
	}
}

/**
 * @param {String} guildId 
 * @returns {Array} 유저 히스토리 배열 (없으면 빈 배열)
 */
async function getGmaePlayedUser(guildId, alarm = true) {
	const API_URL = `${baseUrl}/bot/v1/users?guildSnowflake=${guildId}&discordAlarm=${alarm}`;
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		logger.info('응답 데이터:', response.status, response.data);
		return response.data?.users || [];
	} catch (error) {
		logger.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return []; // ✅ 에러 발생 시에도 항상 빈 배열 반환
	}
}
module.exports = {
	addUserHistory,
	getUserHistory,
	getGmaePlayedUser
}