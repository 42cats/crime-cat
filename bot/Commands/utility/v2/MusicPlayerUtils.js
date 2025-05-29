/**
 * MusicPlayerUtils v2.0 ONLY
 * 음악 플레이어 유틸리티 함수들 (v1.0 시스템 완전 배제)
 * 
 * 설계 원칙:
 * - Pure v2.0 System: v1.0 시스템 완전 배제
 * - Centralized Cache Management: 중앙집중식 캐시 관리
 * - Auto Invalidation: 파일 변경 시 자동 무효화
 * - Cross-Command Integration: 명령어 간 통합 지원
 */

/**
 * 로컬 음악 캐시 무효화
 * 파일 업로드/삭제 시 호출하여 플레이어 캐시 갱신
 */
async function invalidateLocalMusicCache(guildId, userId = null) {
    try {
        console.log(`[MusicPlayerUtils v2.0] Invalidating local music cache for guild: ${guildId}, user: ${userId}`);
        
        // v2.0 시스템 캐시 무효화
        const musicData = global.client?.serverMusicData?.get(guildId);
        if (musicData && musicData.controller && musicData.controller.dataService) {
            musicData.controller.dataService.invalidateCache('local');
            console.log('[MusicPlayerUtils v2.0] Local cache invalidated');
        }
        
        return true;
    } catch (error) {
        console.error('[MusicPlayerUtils v2.0] Cache invalidation failed:', error);
        return false;
    }
}

/**
 * YouTube 음악 캐시 무효화  
 * 주소추가/삭제 시 호출
 */
async function invalidateYouTubeMusicCache(guildId) {
    try {
        console.log(`[MusicPlayerUtils v2.0] Invalidating YouTube music cache for guild: ${guildId}`);
        
        // v2.0 시스템 캐시 무효화
        const musicData = global.client?.serverMusicData?.get(guildId);
        if (musicData && musicData.controller && musicData.controller.dataService) {
            musicData.controller.dataService.invalidateCache('youtube');
            console.log('[MusicPlayerUtils v2.0] YouTube cache invalidated');
        }
        
        return true;
    } catch (error) {
        console.error('[MusicPlayerUtils v2.0] Cache invalidation failed:', error);
        return false;
    }
}

/**
 * 모든 음악 캐시 무효화
 */
async function invalidateAllMusicCache(guildId) {
    try {
        console.log(`[MusicPlayerUtils] Invalidating all music cache for guild: ${guildId}`);
        
        const results = await Promise.allSettled([
            invalidateLocalMusicCache(guildId),
            invalidateYouTubeMusicCache(guildId)
        ]);
        
        const success = results.every(result => result.status === 'fulfilled' && result.value);
        return success;
    } catch (error) {
        console.error('[MusicPlayerUtils] All cache invalidation failed:', error);
        return false;
    }
}

/**
 * 음악 플레이어 UI 강제 업데이트
 * 캐시 무효화 후 UI도 즉시 갱신
 */
async function forceUpdateMusicPlayerUI(guildId) {
    try {
        console.log(`[MusicPlayerUtils v2.0] Force updating music player UI for guild: ${guildId}`);
        
        // v2.0 시스템 UI 업데이트
        const musicData = global.client?.serverMusicData?.get(guildId);
        if (musicData && musicData.interactionMsg) {
            try {
                await musicData.refreshPlaylist();
                const components = await musicData.reply();
                await musicData.interactionMsg.edit(components);
                console.log('[MusicPlayerUtils v2.0] UI updated');
            } catch (error) {
                console.warn('[MusicPlayerUtils v2.0] UI update failed:', error);
            }
        }
        
        return true;
    } catch (error) {
        console.error('[MusicPlayerUtils v2.0] UI force update failed:', error);
        return false;
    }
}

/**
 * 파일 업로드 후 처리
 * 캐시 무효화 + UI 업데이트를 한 번에
 */
async function handleFileUpload(guildId, userId, fileType = 'music') {
    try {
        console.log(`[MusicPlayerUtils] Handling file upload: ${fileType} for guild: ${guildId}, user: ${userId}`);
        
        if (fileType === 'music') {
            // 로컬 음악 캐시 무효화
            await invalidateLocalMusicCache(guildId, userId);
            
            // UI 업데이트 (로컬 모드인 경우에만)
            await forceUpdateMusicPlayerUI(guildId);
        }
        
        console.log('[MusicPlayerUtils] File upload handled successfully');
        return true;
    } catch (error) {
        console.error('[MusicPlayerUtils] File upload handling failed:', error);
        return false;
    }
}

/**
 * 파일 삭제 후 처리
 * 캐시 무효화 + UI 업데이트를 한 번에
 */
async function handleFileDelete(guildId, userId, fileType = 'music') {
    try {
        console.log(`[MusicPlayerUtils] Handling file delete: ${fileType} for guild: ${guildId}, user: ${userId}`);
        
        if (fileType === 'music') {
            // 로컬 음악 캐시 무효화
            await invalidateLocalMusicCache(guildId, userId);
            
            // UI 업데이트 (로컬 모드인 경우에만)
            await forceUpdateMusicPlayerUI(guildId);
        }
        
        console.log('[MusicPlayerUtils] File delete handled successfully');
        return true;
    } catch (error) {
        console.error('[MusicPlayerUtils] File delete handling failed:', error);
        return false;
    }
}

/**
 * YouTube URL 추가 후 처리
 */
async function handleYouTubeAdd(guildId) {
    try {
        console.log(`[MusicPlayerUtils] Handling YouTube add for guild: ${guildId}`);
        
        // YouTube 캐시 무효화
        await invalidateYouTubeMusicCache(guildId);
        
        // UI 업데이트 (YouTube 모드인 경우에만)
        await forceUpdateMusicPlayerUI(guildId);
        
        console.log('[MusicPlayerUtils] YouTube add handled successfully');
        return true;
    } catch (error) {
        console.error('[MusicPlayerUtils] YouTube add handling failed:', error);
        return false;
    }
}

/**
 * YouTube URL 삭제 후 처리
 */
async function handleYouTubeDelete(guildId) {
    try {
        console.log(`[MusicPlayerUtils] Handling YouTube delete for guild: ${guildId}`);
        
        // YouTube 캐시 무효화
        await invalidateYouTubeMusicCache(guildId);
        
        // UI 업데이트 (YouTube 모드인 경우에만)
        await forceUpdateMusicPlayerUI(guildId);
        
        console.log('[MusicPlayerUtils] YouTube delete handled successfully');
        return true;
    } catch (error) {
        console.error('[MusicPlayerUtils] YouTube delete handling failed:', error);
        return false;
    }
}

/**
 * 음악 플레이어 상태 확인
 * v2.0 시스템 상태 확인
 */
function getMusicPlayerStatus(guildId) {
    const musicData = global.client?.serverMusicData?.get(guildId);
    
    return {
        hasPlayer: !!musicData,
        isActive: !!(musicData && musicData.interactionMsg),
        currentMode: musicData?.controller?.state?.ui?.isLocal ? 'local' : 'youtube',
        version: musicData ? '2.0' : 'none',
        state: musicData?.controller?.state?.playback || 'IDLE'
    };
}

module.exports = {
    invalidateLocalMusicCache,
    invalidateYouTubeMusicCache,
    invalidateAllMusicCache,
    forceUpdateMusicPlayerUI,
    handleFileUpload,
    handleFileDelete,
    handleYouTubeAdd,
    handleYouTubeDelete,
    getMusicPlayerStatus
};