const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL


/**
 * 
 * @param {String} guildId
 * @param {String} groupName
 */
async function getButtons(guildId, groupName) {
	const API_URL = `${baseUrl}/bot/v1/messageMacros/buttons/${guildId}/${encodeURI(groupName)}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data;
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data, error?.response?.data?.message);

		throw error.response.data.message;
	}
}

/**
 * 
 * @param {String} buttonId
 */
async function getContents(buttonId) {
	const API_URL = `${baseUrl}/bot/v1/messageMacros/contents/${buttonId}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data.contents;
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data, error?.response?.data?.message);
		throw error.response.data.message;
	}
}



module.exports = {
	getButtons,
	getContents
}