const logger = require('../../utility/logger');
const axios = require('axios');
const { User, Guild, Client, PermissionsBitField } = require('discord.js');
const dotenv = require('dotenv');
const { addUser } = require('../user/user');
const { addUserHistory } = require('../history/history');
dotenv.config();
const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL
/**
 * 
 * @param {Guild} param0 
 * @returns 
 */
async function addGuild({ id, name, ownerId, createdAt }) {
	const API_URL = `${baseUrl}/bot/v1/guilds`;
	const body = {
		snowflake: id,
		name,
		ownerSnowflake: ownerId,
		createdAt: createdAt.toISOString()
	};
	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});
		return response;
	} catch (error) {
		if (error.response?.data?.message === 'already created') {
			logger.info("⛔ 이미 등록된 길드, 처리 생략");
			return { status: 200, data: error.response.data.guild }; // ✅ 응답 모양 맞춰서 반환
		}
		logger.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return null;
	}
}

/**
 * @param {Client} client 
 * @param {Guild} guild 
 */
async function guildMembersAdd(client, guild) {
	try {
		const members = await guild.members.fetch();
		for (const [memberId, member] of members) {
			// 봇이면 스킵할 수도 있음(원하면 로직 추가)
			if (member.user.bot || member.permissions.has(PermissionsBitField.Flags.Administrator)) continue;
			await addUser(member);
			await addUserHistory(member, guild, member.displayName ?? member.nickname, member.joinedAt);
		}
		logger.info("Guild members inserted/updated successfully.");
	}
	catch (err) {
		logger.error("Error inserting users from guild:", err);
	}
}
/**
 * @param {string} guildId
 */
async function deleteGuild(guildId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.delete(API_URL, null, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		logger.info('응답 데이터:', response.status, response.data, response.data.message);
		return response.data.message;
	} catch (error) {
		logger.error('API 요청 실패:', error.response?.data || error.response?.data?.message);
		return error.response.data.message;
	}
}


/**
 * @param {Client} client 
 * @param {Guild} guild 
 */
async function guildAddProcess(client, guild) {
	const guildOwner = await guild.members.fetch(guild.ownerId);
	await addUser(guildOwner);
	logger.info("added owner ");
	await addGuild(guild);
	logger.info("added guild");
	await guildMembersAdd(client, guild);
	logger.info("all guild add process done");

}

module.exports = {
	addGuild,
	guildMembersAdd,
	guildAddProcess,
	getGuildPublicStatus,
	toggleGuildPublicStatus
}

/**
 * 길드의 공개 상태를 조회합니다.
 * @param {string} guildId 길드 ID
 * @returns {Promise<boolean>} 공개 여부 (true: 공개, false: 비공개)
 */
async function getGuildPublicStatus(guildId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/public`;
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});
		return response.data.isPublic;
	} catch (error) {
		logger.error('길드 공개 상태 조회 실패:', error.response?.data || error.message);
		throw error;
	}
}

/**
 * 길드의 공개 상태를 토글합니다.
 * @param {string} guildId 길드 ID
 * @returns {Promise<{message: string, innerDto: {isPublic: boolean}}>} 변경 결과
 */
async function toggleGuildPublicStatus(guildId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/public`;
	try {
		const response = await axios.patch(API_URL, {}, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});
		console.log(response);
		return response.data;
	} catch (error) {
		logger.error('길드 공개 상태 토글 실패:', error.response?.data || error.message);
		throw error;
	}
}