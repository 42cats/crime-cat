const logger = require('../../Commands/utility/logger');
const { updateGuildName, updateGuildOwner } = require('../../Commands/api/guild/guild');

module.exports = {
    name: 'guildUpdate',
    once: false,
    async execute(oldGuild, newGuild) {
        try {
            // 길드 이름이 변경되었는지 확인
            if (oldGuild.name !== newGuild.name) {
                logger.info(`Guild name changed: ${oldGuild.name} -> ${newGuild.name}`);
                await updateGuildName(newGuild.id, newGuild.name);
            }

            // 길드 오너가 변경되었는지 확인
            if (oldGuild.ownerId !== newGuild.ownerId) {
                logger.info(`Guild owner changed: ${oldGuild.ownerId} -> ${newGuild.ownerId}`);
                await updateGuildOwner(newGuild.id, newGuild.ownerId, oldGuild.ownerId);
            }
        } catch (error) {
            logger.error('Failed to update guild:', error.response?.data || error.message);
        }
    }
};