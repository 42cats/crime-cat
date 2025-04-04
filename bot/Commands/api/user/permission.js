const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.API_TOKEN;
const baseUrl = process.env.BASE_URL

/**
 * 특정 유저가 해당 권한을 가지고 있는지 확인합니다.
 * @param {String} userId 
 * @param {String} permissionName 
 * @returns {Boolean} 권한 여부
 */
async function isPermissionHas(userId, permissionName) {
	const API_URL = `${baseUrl}/v1/bot/users/${userId}/permission/${encodeURI(permissionName)}`;
	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		console.log('응답 데이터:', response.status);
		return response.status === 200;
	} catch (error) {
		console.error('API 요청 실패:', error.response?.data || error.response.data.message);
		return false; // ✅ 반드시 false 반환
	}
}


/**
 * @param {User | GuildMember} user 
 */
async function addUserPermisson(user, permissionName) {
	const API_URL = `${baseUrl}/v1/bot/users/${user.id}/permission`;

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
		console.log('응답 데이터:', response.data.message);
		return response;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}


/**
 * @param {string} permissionName
 * @param {number} price
 * @param {number} [duration=28]   
 */
async function addPermisson(name, price, duration = 28) {
	const API_URL = `${baseUrl}/v1/bot/permissions`;


	const body = {
		name,
		price,
		duration
	};

	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});
		console.log('응답 데이터:', response.data.message, response.data);
		return response;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}


/**
 * @param {string} permissionName
 * @param {number} price
 * @param {number} [duration=28]   
 */
async function editPermisson(name, price, duration = 28) {
	const API_URL = `${baseUrl}/v1/bot/permissions/${encodeURI(name)}`;


	const body = {
		name,
		price,
		duration
	};

	try {
		const response = await axios.patch(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});
		console.log('응답 데이터:', response.data.message, response.data);
		return response;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}

/**
 * @param {string} permissionName
 */
async function deletePermisson(name) {
	const API_URL = `${baseUrl}/v1/bot/permissions/${encodeURI(name)}`;

	try {
		const response = await axios.delete(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
			}
		});
		console.log('응답 데이터:', response.data.message, response.data);
		return response;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.response.data.message);
	}
}

module.exports={
	isPermissionHas,
	addUserPermisson,
	editPermisson,
	addPermisson,
	deletePermisson

}