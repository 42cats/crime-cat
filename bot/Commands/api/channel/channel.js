const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.API_TOKEN;
const baseUrl = process.env.BASE_URL

/**
 * @param {Guild} guild
 * @param {String} channelId  
 */
async function addChannelClean(guildId, channelId) {
	const API_URL = `${baseUrl}/v1/bot/guilds/${guildId}/channels/cleans/${channelId}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.post(API_URL,{
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data.message;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}

/**
 * @param {Guild} guild
 * @param {String} channelId  
 */
async function deleteChannelClean(guildId, channelId) {
	const API_URL = `${baseUrl}/v1/bot/guilds/${guildId}/channels/cleans/${channelId}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.delete(API_URL,{
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data, response.data.message);
		return response.data.message;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
		return error.response.message;
	}
}

/**
 * @param {Guild} guild
 * @param {String} channelId  
 */
async function getChannelClean(guildId) {
	const API_URL = `${baseUrl}/v1/bot/guilds/${guildId}/channels/cleans`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL,{
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data.channels;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}

module.exports = {
	addChannelClean,
	deleteChannelClean,
	getChannelClean
}