const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL


/**
 * 
 * @param {String} guildId
 * @param {String} channelId
 * @param {String} content  
 * @param {String} passwordKey 
 */
async function addPasswordContent(guildId, channelId, passwordKey, content) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/password-notes`;  // 요청할 API 엔드포인트
	const body = {
		"channelSnowflake": channelId,
		passwordKey,
		content,
	}
	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data.passwordNote;
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data, error?.response?.data?.message);
		throw error?.response?.data?.message ?? "알수없는 오류";
	}
}

/**
 * 
 * @param {String} guildId
 * @param {String} channelId
 * @param {String} content
 * @param {String} uuid   
 * @param {String} passwordKey 
 */
async function editPasswordContent(guildId, channelId, uuid, passwordKey, content) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/password-notes`;  // 요청할 API 엔드포인트
	const body = {
		uuid,
		"channelSnowflake": channelId,
		passwordKey,
		content,
	}
	try {
		const response = await axios.patch(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data.passwordNote;
	} catch (error) {
		const errorMessage = error.response?.data?.detail || "알 수 없는 오류";
		console.error('비밀번호 수정 API 요청 실패:', error.response?.data);
		throw Error(errorMessage);
	}
}

/**
 * 
 * @param {String} guildId
 * @param {String} passwordKey 
 */
async function deletePasswordContent(guildId, passwordKey) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/password-notes/${passwordKey}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.delete(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data.message;
	} catch (error) {
		const errorMessage = error.response?.data?.detail || "알 수 없는 오류";
		console.error('비밀번호 삭제 API 요청 실패:', error.response?.data);
		throw Error(errorMessage);
	}
}
/**
 * 
 * @param {String} guildId
 * @param {String} channelId
 * @param {String} content  
 * @param {String} passwordKey 
 */
async function getPasswordContents(guildId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/password-notes`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		console.log('응답 데이터11:', response.status, response.data);
		return response.data.passwordNotes;
	} catch (error) {
		const errorMessage = error.response?.data?.detail || "알 수 없는 오류";
		console.error('비밀번호 정성 확인 API 요청 실패:', error.response?.data);
		throw Error(errorMessage)
	}
}

/**
 * 
 * @param {String} guildId
 * @param {String} passwordKey 
 */
async function matchPasswordContent(guildId, passwordKey) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/password-notes/${passwordKey}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data.passwordNote;
	} catch (error) {
		const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || "알 수 없는 오류";
		console.error('비밀번호 매칭 API 요청 실패:', errorMessage);
		throw Error(errorMessage);
	}
}

module.exports = {
	addPasswordContent,
	editPasswordContent,
	deletePasswordContent,
	getPasswordContents,
	matchPasswordContent

}