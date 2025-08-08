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
    console.log('🎵 AudioManager - Setting new current audio:', src);
    console.log('🔍 Previous audio ref:', this.currentAudioRef);
    console.log('🔍 Previous src:', this.currentSrc);
    console.log('🔍 New audio element:', audioElement);
    console.log('🔍 Is same audio element?', this.currentAudioRef === audioElement);
    
    // 이전 오디오가 있다면 정리
    if (this.currentAudioRef && this.currentAudioRef !== audioElement) {
      console.log('🛑 AudioManager - Different audio detected, stopping previous audio:', this.currentSrc);
      console.log('🔍 Previous audio state before stop:', {
        paused: this.currentAudioRef.paused,
        currentTime: this.currentAudioRef.currentTime,
        src: this.currentAudioRef.src
      });
      this.stopCurrentAudio();
    } else if (this.currentAudioRef === audioElement) {
      console.log('ℹ️ AudioManager - Same audio element, no need to stop');
    } else {
      console.log('ℹ️ AudioManager - No previous audio to stop');
    }

    this.currentAudioRef = audioElement;
    this.currentSrc = src;
    
    console.log('✅ AudioManager - Current audio set:', {
      src: this.currentSrc,
      audioElement: this.currentAudioRef
    });
  }

  /**
   * 현재 재생 중인 오디오 정리
   */
  stopCurrentAudio() {
    if (this.currentAudioRef) {
      this.currentAudioRef.pause();
      this.currentAudioRef.currentTime = 0;
      // src는 해제하지 않음 - 컴포넌트에서 관리
      console.log('⏹️ AudioManager - Audio stopped');
    }
    this.currentAudioRef = null;
    this.currentSrc = null;
  }

  /**
   * AudioContext 등록 및 추적
   */
  registerAudioContext(audioContext: AudioContext) {
    this.audioContexts.add(audioContext);
    console.log('🔊 AudioManager - Registered AudioContext:', {
      totalContexts: this.audioContexts.size,
      contextState: audioContext.state
    });
  }

  /**
   * AudioContext 등록 해제
   */
  unregisterAudioContext(audioContext: AudioContext) {
    this.audioContexts.delete(audioContext);
    this.suspendedContexts.delete(audioContext);
    console.log('🔊 AudioManager - Unregistered AudioContext:', {
      totalContexts: this.audioContexts.size
    });
  }

  /**
   * 모든 오디오 강제 정지 (페이지 전환 시 사용)
   * DOM 참조가 무효한 상황에서도 안전하게 동작
   */
  forceStopAll() {
    console.log('🚨 AudioManager - Force stopping all audio elements');
    console.log('🔍 Current audio ref:', this.currentAudioRef);
    console.log('🔍 Current src:', this.currentSrc);
    console.log('🔊 Active AudioContexts:', this.audioContexts.size);
    
    // 1. 현재 참조가 있고 유효한 경우 정리
    if (this.currentAudioRef) {
      try {
        console.log('🎵 Current audio paused?', this.currentAudioRef.paused);
        console.log('🎵 Current audio currentTime:', this.currentAudioRef.currentTime);
        console.log('🎵 Current audio src:', this.currentAudioRef.src);
        
        if (!this.currentAudioRef.paused) {
          console.log('⏸️ Pausing current audio ref');
          this.currentAudioRef.pause();
          this.currentAudioRef.currentTime = 0;
        }
      } catch (error) {
        console.warn('❌ AudioManager - Current audio ref invalid, skipping:', error);
      }
    } else {
      console.log('ℹ️ No current audio ref to stop');
    }
    
    // 2. DOM에서 모든 audio 엘리먼트 강제 정지 (안전장치)
    try {
      const audioElements = document.querySelectorAll('audio');
      console.log(`🔍 Found ${audioElements.length} audio elements in DOM`);
      
      audioElements.forEach((audio, index) => {
        console.log(`🎵 Audio element ${index + 1}:`, {
          paused: audio.paused,
          currentTime: audio.currentTime,
          src: audio.src,
          duration: audio.duration,
          readyState: audio.readyState
        });
        
        if (!audio.paused) {
          console.log(`🛑 AudioManager - Force stopping audio element ${index + 1}`);
          audio.pause();
          audio.currentTime = 0;
          
          // 추가적인 정리 시도
          try {
            audio.load(); // 오디오 엘리먼트 완전 초기화
          } catch (loadError) {
            console.warn(`⚠️ Failed to reload audio element ${index + 1}:`, loadError);
          }
        }
      });
    } catch (error) {
      console.error('❌ AudioManager - Error during force stop all:', error);
    }
    
    // 3. 내부 상태 초기화
    this.currentAudioRef = null;
    this.currentSrc = null;
    
    // 4. 정리 후 재확인
    setTimeout(() => {
      const stillPlayingAudios = document.querySelectorAll('audio');
      const playingCount = Array.from(stillPlayingAudios).filter(audio => !audio.paused).length;
      console.log(`🔍 After cleanup - ${playingCount} audio elements still playing out of ${stillPlayingAudios.length} total`);
      
      if (playingCount > 0) {
        console.warn('⚠️ Some audio elements are still playing after cleanup attempt');
        stillPlayingAudios.forEach((audio, index) => {
          if (!audio.paused) {
            console.warn(`🚨 Still playing audio ${index + 1}:`, {
              src: audio.src,
              currentTime: audio.currentTime,
              volume: audio.volume
            });
            
            // 최후의 수단: src 제거
            try {
              audio.src = '';
              audio.load();
            } catch (e) {
              console.error(`❌ Failed to clear src for audio ${index + 1}:`, e);
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
        console.log('🔊 Attempting browser-level audio cleanup');
        
        // 페이지의 모든 미디어 스트림 정지 시도
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // 활성 미디어 스트림이 있다면 정지 시도 (보통은 없지만 안전장치)
          console.log('🎤 Checking for active media streams');
        }
      }
    } catch (error) {
      console.warn('⚠️ Browser-level audio control failed:', error);
    }
    
    console.log('✅ AudioManager - All audio elements force stopped');
  }

  /**
   * 모든 AudioContext 일시정지
   */
  private suspendAllAudioContexts() {
    if (this.audioContexts.size === 0) {
      console.log('ℹ️ No AudioContexts to suspend');
      return;
    }

    console.log(`🔊 AudioManager - Suspending ${this.audioContexts.size} AudioContext instances`);
    
    for (const audioContext of this.audioContexts) {
      try {
        if (audioContext.state === 'running') {
          console.log('⏸️ Suspending AudioContext:', audioContext.state);
          audioContext.suspend().then(() => {
            this.suspendedContexts.add(audioContext);
            console.log('✅ AudioContext suspended successfully');
          }).catch(error => {
            console.warn('⚠️ Failed to suspend AudioContext:', error);
          });
        } else {
          console.log('ℹ️ AudioContext already suspended/closed:', audioContext.state);
        }
      } catch (error) {
        console.warn('❌ Error suspending AudioContext:', error);
      }
    }
  }

  /**
   * MediaSession API 초기화
   */
  private resetMediaSession() {
    try {
      if ('mediaSession' in navigator) {
        console.log('📱 AudioManager - Resetting MediaSession');
        
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
            console.debug(`MediaSession action ${action} not supported:`, error);
          }
        });
        
        console.log('✅ MediaSession reset completed');
      } else {
        console.log('ℹ️ MediaSession API not available');
      }
    } catch (error) {
      console.warn('⚠️ Failed to reset MediaSession:', error);
    }
  }

  /**
   * 일시정지된 AudioContext 복원
   */
  resumeAudioContexts() {
    if (this.suspendedContexts.size === 0) {
      console.log('ℹ️ No suspended AudioContexts to resume');
      return;
    }

    console.log(`🔊 AudioManager - Resuming ${this.suspendedContexts.size} suspended AudioContext instances`);
    
    for (const audioContext of this.suspendedContexts) {
      try {
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            this.suspendedContexts.delete(audioContext);
            console.log('✅ AudioContext resumed successfully');
          }).catch(error => {
            console.warn('⚠️ Failed to resume AudioContext:', error);
          });
        }
      } catch (error) {
        console.warn('❌ Error resuming AudioContext:', error);
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
      console.log('🗑️ AudioManager - Clearing unmounted audio component');
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