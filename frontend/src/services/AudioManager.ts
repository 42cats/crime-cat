/**
 * 전역 오디오 매니저 - 동시 재생 방지 및 오디오 상태 관리
 */
class AudioManager {
  private static instance: AudioManager;
  private currentAudioRef: HTMLAudioElement | null = null;
  private currentSrc: string | null = null;
  
  // Web Audio API 컨텍스트 추적
  private audioContexts = new Set<AudioContext>();
  private suspendedContexts = new Set<AudioContext>();

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * 새로운 오디오 재생 시작 전 이전 오디오 정리
   */
  setCurrentAudio(audioElement: HTMLAudioElement, src: string) {
    
    // 이전 오디오가 있다면 정리
    if (this.currentAudioRef && this.currentAudioRef !== audioElement) {
      this.stopCurrentAudio();
    } else if (this.currentAudioRef === audioElement) {
    } else {
    }

    this.currentAudioRef = audioElement;
    this.currentSrc = src;
    
  }

  /**
   * 현재 재생 중인 오디오 정리
   */
  stopCurrentAudio() {
    if (this.currentAudioRef) {
      this.currentAudioRef.pause();
      this.currentAudioRef.currentTime = 0;
      // src는 해제하지 않음 - 컴포넌트에서 관리
    }
    this.currentAudioRef = null;
    this.currentSrc = null;
  }

  /**
   * AudioContext 등록 및 추적
   */
  registerAudioContext(audioContext: AudioContext) {
    this.audioContexts.add(audioContext);
  }

  /**
   * AudioContext 등록 해제
   */
  unregisterAudioContext(audioContext: AudioContext) {
    this.audioContexts.delete(audioContext);
    this.suspendedContexts.delete(audioContext);
  }

  /**
   * 모든 오디오 강제 정지 (페이지 전환 시 사용)
   * DOM 참조가 무효한 상황에서도 안전하게 동작
   */
  forceStopAll() {
    
    // 1. 현재 참조가 있고 유효한 경우 정리
    if (this.currentAudioRef) {
      try {
        if (!this.currentAudioRef.paused) {
          this.currentAudioRef.pause();
          this.currentAudioRef.currentTime = 0;
        }
      } catch (error) {
      }
    } else {
    }
    
    // 2. DOM에서 모든 audio 엘리먼트 강제 정지 (안전장치)
    try {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio) => {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
          
          try {
            audio.load();
          } catch (loadError) {
            // Silent failure
          }
        }
      });
    } catch (error) {
      // Silent failure
    }
    
    // 3. 내부 상태 초기화
    this.currentAudioRef = null;
    this.currentSrc = null;
    
    // 4. 정리 후 재확인
    setTimeout(() => {
      const stillPlayingAudios = document.querySelectorAll('audio');
      const playingCount = Array.from(stillPlayingAudios).filter(audio => !audio.paused).length;
      
      if (playingCount > 0) {
        stillPlayingAudios.forEach((audio) => {
          if (!audio.paused) {
            try {
              audio.src = '';
              audio.load();
            } catch (e) {
              // Silent failure
            }
          }
        });
      }
    }, 50);
    
    // 5. Web Audio API 컨텍스트 일시정지
    this.suspendAllAudioContexts();
    
    // 6. MediaSession API 제어
    this.resetMediaSession();
    
    // 7. 브라우저 레벨 추가 정리 시도
    try {
      // 전역 AudioContext 생성 감지 및 정리 (가능한 경우)
      if (window.AudioContext || (window as any).webkitAudioContext) {
      }
    } catch (error) {
    }
    
  }

  /**
   * 모든 AudioContext 일시정지
   */
  private suspendAllAudioContexts() {
    if (this.audioContexts.size === 0) {
      return;
    }
    
    for (const audioContext of this.audioContexts) {
      try {
        if (audioContext.state === 'running') {
          audioContext.suspend().then(() => {
            this.suspendedContexts.add(audioContext);
          }).catch(() => {
            // Silent failure
          });
        }
      } catch (error) {
      }
    }
  }

  /**
   * MediaSession API 초기화
   */
  private resetMediaSession() {
    try {
      if ('mediaSession' in navigator) {
        
        // 재생 상태를 중지로 설정
        navigator.mediaSession.playbackState = 'paused';
        
        // 메타데이터 정리
        navigator.mediaSession.metadata = null;
        
        // 액션 핸들러들 제거 (가능한 경우)
        const actions = ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack'] as const;
        actions.forEach(action => {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch (error) {
            // 일부 브라우저에서는 특정 액션을 지원하지 않을 수 있음
          }
        });
        
      } else {
      }
    } catch (error) {
    }
  }

  /**
   * 일시정지된 AudioContext 복원
   */
  resumeAudioContexts() {
    if (this.suspendedContexts.size === 0) {
      return;
    }
    
    for (const audioContext of this.suspendedContexts) {
      try {
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            this.suspendedContexts.delete(audioContext);
          }).catch(() => {
            // Silent failure
          });
        }
      } catch (error) {
      }
    }
  }

  /**
   * 특정 오디오가 현재 활성 상태인지 확인
   */
  isCurrentAudio(audioElement: HTMLAudioElement): boolean {
    return this.currentAudioRef === audioElement;
  }

  /**
   * 오디오 컴포넌트 언마운트 시 정리
   */
  clearAudio(audioElement: HTMLAudioElement) {
    if (this.currentAudioRef === audioElement) {
      this.currentAudioRef = null;
      this.currentSrc = null;
    }
  }

  /**
   * 현재 상태 조회
   */
  getStatus() {
    return {
      hasCurrentAudio: !!this.currentAudioRef,
      currentSrc: this.currentSrc,
      isPlaying: this.currentAudioRef ? !this.currentAudioRef.paused : false,
      audioContextsCount: this.audioContexts.size,
      suspendedContextsCount: this.suspendedContexts.size,
      mediaSessionSupported: 'mediaSession' in navigator,
      mediaSessionState: 'mediaSession' in navigator ? navigator.mediaSession.playbackState : 'not-supported'
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const audioManager = AudioManager.getInstance();