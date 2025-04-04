const axios = require('axios');
const { User, Guild } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const BEARER_TOKEN = process.env.API_TOKEN;
const baseUrl = process.env.BASE_URL

/**
 * 
 * @param {int} value
 * @param {int} count
 * @param {int} duration 
 */
async function createCoupon(value,count, duration) {
	const API_URL = `${baseUrl}/v1/bot/coupons`;  // 요청할 API 엔드포인트
	console.log("API URL = ", API_URL);
	const body = {
		"value": value,  // coupon price
		"count": count, //number of coupons
		"duration": duration // expire of coupon
	}
	try {
		const response = await axios.post(API_URL, body, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`,
				'Content-Type': 'application/json'  // JSON 형식 요청
			}
		});
		console.log('응답 데이터:', response.status);
		return response.data;
	} catch (error) {
		console.error('API 요청 실패:', error.response ? error.response.data : error.message);
	}
}
module.exports = {
	createCoupon,
}