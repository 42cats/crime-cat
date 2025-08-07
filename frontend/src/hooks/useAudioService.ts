import { useEffect } from 'react';
import { audioService } from '@/services/AudioService';

/**
 * AudioService 관리 훅
 * 앱 생명주기와 연동하여 메모리 누수 방지
 */
export const useAudioService = () => {
  // 페이지 언로드 시 캐시 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      audioService.clearCache();
    };

    const handleVisibilityChange = () => {
      // 페이지가 숨겨진 지 10분 후 캐시 정리
      if (document.visibilityState === 'hidden') {
        setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            audioService.clearCache();
          }
        }, 10 * 60 * 1000); // 10분
      }
    };

    // 메모리 압박 시 캐시 정리
    const handleMemoryPressure = () => {
      const stats = audioService.getCacheStats();
      if (stats.audioCacheSize > 20 || stats.totalSize > 100 * 1024 * 1024) { // 100MB 초과
        console.warn('AudioService cache size exceeded, clearing cache');
        audioService.clearCache();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 5분마다 메모리 압박 확인
    const memoryCheckInterval = setInterval(handleMemoryPressure, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(memoryCheckInterval);
      // 컴포넌트 언마운트 시에는 캐시 정리하지 않음 (다른 컴포넌트가 사용 중일 수 있음)
    };
  }, []);

  return {
    audioService,
    getCacheStats: () => audioService.getCacheStats(),
    clearCache: () => audioService.clearCache(),
    preloadAudio: (urls: string[]) => audioService.preloadAudio(urls)
  };
};

/**
 * 컴포넌트별 오디오 정리 훅
 */
export const useAudioCleanup = (urls: string[]) => {
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 해당 URL들만 캐시에서 제거
      urls.forEach(url => audioService.invalidateCache(url));
    };
  }, [urls]);
};