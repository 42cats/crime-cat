const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL

/**
 * @param {string} guildId
 * @param {String} channelId  
 */
async function addChannelClean(guildId, channelId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/channels/cleans/${channelId}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.post(API_URL, null, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data.message;
	} catch (error) {
		return error?.response?.data?.detail || "알수없는 에러";
		console.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
	}
}
/**
 * @param {string} guildId
 * @param {String} channelId  
 */
async function addChannelMessage(guildId, channelId, input) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/records`;  // 요청할 API 엔드포인트
	const body = {
		"channelSnowflake": channelId,  // discord channel_id snowflake, 봇에서 확인
		"message": input,  //string

	};
	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data.message;
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return error?.response?.data?.detail || "알수없는 에러";
	}
}
/**
 * @param {string} guildId
 * @param {String} channelId  
 */
async function deleteChannelClean(guildId, channelId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/channels/cleans/${channelId}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.delete(API_URL, null, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data, response.data.message);
		return response.data.message;
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return error?.response?.data?.detail || "알수없는 에러";
	}
}

/**
 * @param {string} guildId
 * @param {String} channelId  
 */
async function deleteChannelMessage(guildId, channelId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/records/${channelId}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.delete(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		console.log('응답 데이터:', response.status, response.data, response.data.message);
		return response.data.message;
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return error?.response?.data?.detail || "알수없는 에러";
	}
}

/**
 * @param {Guild} guild
 * @param {String} channelId  
 */
async function getChannelClean(guildId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/channels/cleans`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response?.data?.channels ?? [];
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return [];
	}
}
/**
 * @param {Guild} guild
 * @param {String} channelId  
 */
async function getGuildChannelMessage(guildId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/records`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response?.data?.records ?? [];
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return [];
	}
}
module.exports = {
	addChannelClean,
	deleteChannelClean,
	getChannelClean,
	addChannelMessage,
	deleteChannelMessage,
	getGuildChannelMessage
}