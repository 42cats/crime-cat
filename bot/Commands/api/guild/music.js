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
async function addGuildMusic(guildId, { title, url, thumbnail, duration }) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/music`;  // 요청할 API 엔드포인트
	const body = {
		title,
		url,
		thumbnail,
		duration
	};
	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data;
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data, error.response?.data?.message);
	}
}

/**
 * @param {Guild} guild
 * @param {String} channelId  
 */
async function deleteGuildMusic(guildId, title) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/music`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.delete(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'title': encodeURI(title)
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}

/**
 * @param {Guild} guild
 * @param {String} channelId  
 */
async function getGuildMusic(guildId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/music`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data.musicList ? response.data.musicList : [];
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error?.response?.data : error.response?.data?.message);
		return [];
	}
}

module.exports = {
	addGuildMusic,
	deleteGuildMusic,
	getGuildMusic
}