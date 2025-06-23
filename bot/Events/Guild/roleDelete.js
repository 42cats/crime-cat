const { handleRoleEvent } = require('../../Commands/api/cache/cache');
const logger = require('../../Commands/utility/logger');

module.exports = {
    name: 'roleDelete',
    once: false,
    async execute(role) {
        try {
            const guildId = role.guild.id;
            const roleInfo = {
                id: role.id,
                name: role.name,
                color: role.color
            };

            logger.info('🏷️ [이벤트] 역할 삭제 감지', {
                guildId,
                roleId: role.id,
                roleName: role.name,
                roleColor: role.color
            });

            // 캐시 무효화 API 호출
            await handleRoleEvent(guildId, roleInfo, 'delete');

            logger.info('✅ [캐시 무효화] 역할 삭제로 인한 캐시 무효화 완료', {
                guildId,
                roleId: role.id,
                roleName: role.name
            });

        } catch (error) {
            logger.error('❌ [이벤트 처리 실패] roleDelete:', {
                error: error.message,
                stack: error.stack,
                roleId: role.id,
                guildId: role.guild?.id
            });
        }
    }
};