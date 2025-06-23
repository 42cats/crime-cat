const logger = require('../../Commands/utility/logger');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL;

module.exports = {
    name: 'GuildUpdate',
    once: false,
    async execute(oldGuild, newGuild) {
        try {
            // 길드 이름이 변경되었는지 확인
            if (oldGuild.name !== newGuild.name) {
                logger.info(`Guild name changed: ${oldGuild.name} -> ${newGuild.name}`);
                
                // 백엔드로 길드 이름 업데이트 요청
                const API_URL = `${baseUrl}/bot/v1/guilds/${newGuild.id}/name`;
                
                const response = await axios.patch(API_URL, {
                    name: newGuild.name
                }, {
                    headers: {
                        'Authorization': `Bearer ${BEARER_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                logger.info(`Guild name updated successfully: ${response.data.message}`);
            }
        } catch (error) {
            logger.error('Failed to update guild name:', error.response?.data || error.message);
        }
    }
};