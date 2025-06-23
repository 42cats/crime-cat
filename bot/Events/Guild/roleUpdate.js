const { handleRoleEvent } = require('../../Commands/api/cache/cache');
const logger = require('../../Commands/utility/logger');

module.exports = {
    name: 'roleUpdate',
    once: false,
    async execute(oldRole, newRole) {
        try {
            const guildId = newRole.guild.id;
            const roleInfo = {
                id: newRole.id,
                name: newRole.name,
                color: newRole.color,
                oldName: oldRole.name,
                changes: {
                    name: oldRole.name !== newRole.name,
                    color: oldRole.color !== newRole.color,
                    permissions: oldRole.permissions.bitfield !== newRole.permissions.bitfield,
                    position: oldRole.position !== newRole.position
                }
            };

            logger.info('🏷️ [이벤트] 역할 수정 감지', {
                guildId,
                roleId: newRole.id,
                oldName: oldRole.name,
                newName: newRole.name,
                roleColor: newRole.color,
                changes: roleInfo.changes
            });

            // 캐시 무효화 API 호출
            await handleRoleEvent(guildId, roleInfo, 'update');

            logger.info('✅ [캐시 무효화] 역할 수정으로 인한 캐시 무효화 완료', {
                guildId,
                roleId: newRole.id,
                roleName: newRole.name
            });

        } catch (error) {
            logger.error('❌ [이벤트 처리 실패] roleUpdate:', {
                error: error.message,
                stack: error.stack,
                roleId: newRole.id,
                guildId: newRole.guild?.id
            });
        }
    }
};