const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.API_TOKEN;
const baseUrl = process.env.BASE_URL

/**
 *@param {String} guildId
 *@param {String} characterName
 *@param {String} roleId    
 */
async function addCharacterInfo(guildId, characterName, roleId) {
	const API_URL = `${baseUrl}/v1/bot/guilds/characters`;  // 요청할 API 엔드포인트
	console.log("API URL = ", API_URL);
	const body = {
		"guildSnowflake": guildId,
		"characterName": characterName,
		"roles": roleId
	}
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
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}

/**
 * @param {String} guildId
 * @param {String} characterName  
 */
async function deleteCharacter(guildId, characterName) {
	const API_URL = `${baseUrl}/v1/bot/guilds/${guildId}/characters/${characterName}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.delete(API_URL,{
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}

/**
 * @param {String} guildId
 */
async function getCharacterNames(guildId) {
	const API_URL = `${baseUrl}/v1/bot/guilds/${guildId}/characters`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.get(API_URL,{
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data);
		return response.data;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}

module.exports = {
	addCharacterInfo,
	deleteCharacter,
	getCharacterNames
}