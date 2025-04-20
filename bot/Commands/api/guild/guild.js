const axios = require('axios');
const { User, Guild, Client } = require('discord.js');
const dotenv = require('dotenv');
const { addUser } = require('../user/user');
const { addUserHistory } = require('../history/history');
dotenv.config();
const BEARER_TOKEN = process.env.API_TOKEN;
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
			console.log("⛔ 이미 등록된 길드, 처리 생략");
			return { status: 200, data: error.response.data.guild }; // ✅ 응답 모양 맞춰서 반환
		}
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
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
			if (member.user.bot) continue;
			await addUser(member);
			await addUserHistory(member, guild, member.displayName ?? member.nickname, member.joinedAt);
		}
		console.log("Guild members inserted/updated successfully.");
	}
	catch (err) {
		console.error("Error inserting users from guild:", err.response.data.message);
	}
}
/**
 * @param {string} guildId
 */
async function deleteGuild(guildId) {
	const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}`;  // 요청할 API 엔드포인트
	try {
		const response = await axios.delete(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status, response.data, response.data.message);
		return response.data.message;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
		return error.response.data.message;
	}
}


/**
 * @param {Client} client 
 * @param {Guild} guild 
 */
async function guildAddProcess(client, guild) {
	console.log("guildAddProcess()::::::::::::::")
	const guildOwner = await guild.members.fetch(guild.ownerId);
	console.log("owner obj = ", guildOwner);
	await addUser(guildOwner);
	console.log("added owner ");
	await addGuild(guild);
	console.log("added guild");
	await guildMembersAdd(client, guild);
	console.log("all guild add process done");

}

module.exports = {
	addGuild,
	guildMembersAdd,
	guildAddProcess
}