import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { audioManager } from '@/services/AudioManager';
import { audioService } from '@/services/AudioService';

/**
 * React Router 페이지 변경 감지 시 오디오 자동 정리 훅
 * 
 * 페이지 이동 시 이전 페이지의 오디오가 계속 재생되는 문제를 해결하기 위해
 * location.pathname이 변경될 때마다 모든 오디오를 강제로 정리합니다.
 */
export const useRouterAudioCleanup = () => {
  const location = useLocation();

  useEffect(() => {
    
    // 페이지 변경 시 모든 오디오 즉시 정지
    audioManager.forceStopAll();
    
    // 메모리 최적화된 AudioService는 참조 카운팅으로 자동 관리됨
    
    // 추가적인 안전장치: DOM 레벨에서 오디오 상태 확인
    const timeoutId = setTimeout(() => {
      const allAudios = document.querySelectorAll('audio');
      const stillPlayingAudios = Array.from(allAudios).filter(audio => !audio.paused);
      
      
      if (stillPlayingAudios.length > 0) {
        stillPlayingAudios.forEach((audio) => {
          try {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
            audio.load();
          } catch (error) {
            console.error('Failed to cleanup audio element:', error);
          }
        });
        
        audioManager.forceStopAll();
      }
    }, 100); // 타이밍 단축 (참조 카운팅이 즉시 정리하므로)

    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname]);

  // 브라우저 뒤로가기/앞으로가기 감지
  useEffect(() => {
    const handlePopState = () => {
      audioManager.forceStopAll();
      
      // 참조 카운팅 시스템이 자동으로 정리하므로 추가 작업 불필요
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 페이지 가시성 변경 시 (탭 전환 등)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        audioManager.forceStopAll();
        
        // 백그라운드에서 메모리 정리 트리거 (선택적)
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};