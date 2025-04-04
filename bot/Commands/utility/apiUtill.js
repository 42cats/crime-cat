const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.API_TOKEN;
const baseUrl = process.env.BASE_URL
async function getCharacterName(guildId) {

	const API_URL = `${baseUrl}/v1/bot/guilds/${guildId}/characters`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		if (response.status === 200)
			return response.data.characters;
		console.log('응답 데이터:', response.data);
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.message);
	}
}

async function addCharacterName(guildId, name, roleId) {
	const API_URL = `${baseUrl}/v1/bot/guilds/${guildId}/characters`;  // 요청할 API 엔드포인트
	const body = {
		"guildSnowflake": guildId,
		"characterName": name,
		"roles": roleId
	}
	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		console.log('응답 데이터:', response.status);
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.message);
	}
}

async function delCharacterName(guildId, name) {

	const API_URL = `${baseUrl}/v1/bot/guilds/${guildId}/characters`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.delete(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json',  // JSON 형식 요청
				'characterName': name
			}
		});
		console.log('응답 데이터:', response.data);
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.message);
	}
}


/**
 * 
 * @param {User} params 
 */
async function addUserPermission({ id }, permissionName) {
	const API_URL = `${baseUrl}/v1/bot/users/${id}/permission/`;  // 요청할 API 엔드포인트
	const body = {
		"permissionName": permissionName
	}
	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		console.log('응답 데이터:', response.status);
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.message);
	}
}

/**
 * 
 * @param {User} param0 
 * @param {String} permissionName 
 */
async function isPermissionHas({ id }, permissionName) {
	const API_URL = `${baseUrl}/v1/bot/users/${id}/permission/${encodeURI(permissionName)}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		console.log('응답 데이터:', response.status);
		if (response.status === 200)
			return true;
		return false;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.message);
	}
}
/**
 * 
 * @param {User} param0 
 */
async function getUserPermission({ id }) {
	const API_URL = `${baseUrl}/v1/bot/users/${id}/permission`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		console.log('응답 데이터:', response.status);
		if (response.status === 200)
			return response.data.permissions;
		return null;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.message);
	}
}

/**
 * 
 * @param {User} param0 
 */
async function getUserRanks({ id }) {
	const API_URL = `${baseUrl}/v1/bot/users/${id}/rank`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		console.log('응답 데이터:', response.status);
		if (response.status === 200)
			return response.data;
		return null;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.message);
	}
}

async function getRanks(type, limit = 10, pages = 0) {
	const API_URL = `${baseUrl}/v1/bot/users/ranks?target=${type}&limit=${limit}&page=${pages}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		console.log('응답 데이터:', response.status);
		if (response.status === 200)
			return response.data;
		return null;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.message);
	}
}


/**
 * 
 * @param {User} param0 
 */
async function getUserHistory({ id: userId }) {
	const API_URL = `${baseUrl}/v1/bot/histories/${userId}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		console.log('응답 데이터:', response.status);
		if (response.status === 200)
			return response.data.history;
		return null;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.message);
	}
}

async function addGuild({ }) {

}

module.exports = {
	addUser
}