const logger = require('../../utility/logger');
const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL


/**
 * @param {User | GuildMember} user 
 */
async function addUser(user) {
	const API_URL = `${baseUrl}/bot/v1/users`;

	// GuildMember 또는 User 객체 구분
	const userObj = user.user ?? user;

	const body = {
		userSnowflake: userObj.id,
		name: userObj.username,
		avatar: userObj.avatar ? userObj.avatarURL() : "https://cdn.discordapp.com/embed/avatars/0.png"
	};

	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});
		logger.info('응답 데이터:', response?.data?.message);
	} catch (error) {
		logger.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
	}
}

/**
 * @param {User | GuildMember} user 
 */
async function addUserPermisson(user, permissionName) {
	const API_URL = `${baseUrl}/bot/v1/users/${user.id}/permission`;

	// GuildMember 또는 User 객체 구분
	const userObj = user.user ?? user;

	const body = {
		permissionName
	};

	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});
		logger.info('응답 데이터:', response?.data?.message);
		return response;
	} catch (error) {
		logger.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
	}
}

/**
 * @param {String} userId 
 */
async function getUserRank(userId) {
	const API_URL = `${baseUrl}/bot/v1/users/${userId}/rank`;

	// GuildMember 또는 User 객체 구분
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		logger.info('응답 데이터:', response?.data?.message, response?.data);
		return response.data;
	} catch (error) {
		logger.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
	}
}

/**
 * @param {String} userId 
 */
async function getUserPermissons(userId) {
	const API_URL = `${baseUrl}/bot/v1/users/${userId}/permissions`;

	// GuildMember 또는 User 객체 구분
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		logger.info('응답 데이터 유저 퍼미션:', response?.data?.permissions);
		return response?.data?.permissions ?? [];
	} catch (error) {
		logger.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return [];
	}
}

/**
 * @param {String} userId 
 */
async function getUserDbInfo(userId) {
	const API_URL = `${baseUrl}/bot/v1/users/${userId}`;
	logger.info("✅ getUserDbInfo 시작"); // 추가

	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		logger.info("✅ getUserDbInfo 응답 받음", response?.data);
		return response?.data?.user ?? {};
	} catch (error) {
		logger.error('❌ getUserDbInfo 실패:', error.response?.data || error.response?.data?.message);
		return {};
	}
}



/**
* @param {String} userId 
*/
async function setUserAlarm(userId, alarm = null, avatarUrl = null) {
	const API_URL = `${baseUrl}/bot/v1/users/${userId}`;
	const body = {};

	if (alarm !== null) body.discordAlarm = alarm;
	if (avatarUrl !== null) body.avatar = avatarUrl;
	try {
		const response = await axios.patch(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		logger.info('응답 데이터:', response?.data?.message, response?.data);
		return response?.data?.message ?? "알림 설정 실패";
	} catch (error) {
		logger.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return error.response.data.message;
	}
}
module.exports = {
	addUser,
	addUserPermisson,
	getUserRank,
	getUserPermissons,
	setUserAlarm,
	getUserDbInfo
}