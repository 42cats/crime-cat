import React, { useEffect, useRef, useState } from 'react';

interface RemoteAudioPlayerProps {
  remoteStreams: { [trackId: string]: MediaStream };
  speakerMuted?: boolean;
}

/**
 * 원격 오디오 스트림을 재생하는 컴포넌트
 * 각 원격 사용자의 오디오를 자동으로 재생
 * DOM에 연결된 실제 audio 엘리먼트를 사용하여 브라우저 호환성 개선
 */
export const RemoteAudioPlayer: React.FC<RemoteAudioPlayerProps> = ({ 
  remoteStreams, 
  speakerMuted = false 
}) => {
  const audioRefs = useRef<{ [trackId: string]: HTMLAudioElement }>({});
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  useEffect(() => {
    console.log('🔊 RemoteAudioPlayer: 스트림 업데이트', {
      streamCount: Object.keys(remoteStreams).length,
      streamIds: Object.keys(remoteStreams),
      speakerMuted
    });

    // 새로운 스트림들을 오디오 엘리먼트에 연결
    Object.entries(remoteStreams).forEach(([trackId, stream]) => {
      if (!audioRefs.current[trackId]) {
        console.log(`🎵 새로운 원격 오디오 스트림 생성: ${trackId}`);
        
        // DOM에 연결된 실제 audio 엘리먼트 생성
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.playsInline = true;
        audio.muted = speakerMuted;
        audio.volume = speakerMuted ? 0 : 1;
        
        // 접근성을 위한 속성 설정
        audio.setAttribute('data-remote-audio', 'true');
        audio.setAttribute('data-track-id', trackId);
        audio.style.display = 'none'; // 숨김 처리
        
        // DOM에 추가 (브라우저 호환성 개선)
        document.body.appendChild(audio);
        
        // MediaStream 트랙 상태 확인
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          const track = audioTracks[0];
          console.log(`📊 트랙 상태: ${trackId}`, {
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted
          });
        }
        
        // 트랙 활성화 상태 모니터링
        const monitorTrackState = () => {
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            const track = audioTracks[0];
            
            // 트랙 상태 변경 이벤트 리스너
            track.addEventListener('mute', () => {
              console.log(`🔇 트랙 음소거됨: ${trackId}`);
            });
            
            track.addEventListener('unmute', () => {
              console.log(`🔊 트랙 음소거 해제됨: ${trackId}`);
              // 음소거 해제 시 재생 재시도
              attemptPlayback();
            });
            
            track.addEventListener('ended', () => {
              console.log(`🔚 트랙 종료됨: ${trackId}`);
            });
          }
        };
        
        // 향상된 오디오 재생 로직
        const attemptPlayback = async () => {
          try {
            // 트랙 상태 재확인
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
              console.warn(`⚠️ 오디오 트랙이 없음: ${trackId}`);
              return;
            }
            
            const track = audioTracks[0];
            if (!track.enabled || track.readyState !== 'live') {
              console.warn(`⚠️ 트랙이 비활성 상태: ${trackId}`, {
                enabled: track.enabled,
                readyState: track.readyState
              });
              // 3초 후 재시도
              setTimeout(attemptPlayback, 3000);
              return;
            }
            
            await audio.play();
            console.log(`✅ 원격 오디오 재생 시작: ${trackId}`);
            setNeedsUserInteraction(false);
          } catch (error) {
            console.warn(`⚠️ 원격 오디오 재생 실패: ${trackId}`, error);
            
            // DOMException이고 autoplay 정책에 의한 차단인 경우
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
              console.log('🖱️ 사용자 상호작용 필요 - 클릭 대기 중');
              setNeedsUserInteraction(true);
              
              // 사용자 클릭 이벤트 리스너 등록
              const handleUserInteraction = async () => {
                try {
                  await audio.play();
                  console.log(`✅ 사용자 상호작용 후 재생 성공: ${trackId}`);
                  setNeedsUserInteraction(false);
                  document.removeEventListener('click', handleUserInteraction);
                  document.removeEventListener('keydown', handleUserInteraction);
                } catch (retryError) {
                  console.error('사용자 상호작용 후에도 재생 실패:', retryError);
                }
              };
              
              document.addEventListener('click', handleUserInteraction, { once: true });
              document.addEventListener('keydown', handleUserInteraction, { once: true });
            } else {
              // 다른 오류의 경우 음소거로 재시도
              try {
                audio.muted = true;
                await audio.play();
                console.log(`✅ 음소거 상태로 재생 시작: ${trackId}`);
              } catch (mutedError) {
                console.error('음소거 상태로도 재생 실패:', mutedError);
              }
            }
          }
        };
        
        monitorTrackState();
        attemptPlayback();
        audioRefs.current[trackId] = audio;
      }
    });

    // 제거된 스트림들의 오디오 엘리먼트 정리
    Object.keys(audioRefs.current).forEach(trackId => {
      if (!remoteStreams[trackId]) {
        console.log(`🗑️ 원격 오디오 스트림 제거: ${trackId}`);
        const audio = audioRefs.current[trackId];
        if (audio) {
          audio.pause();
          audio.srcObject = null;
          // DOM에서 제거
          if (audio.parentNode) {
            audio.parentNode.removeChild(audio);
          }
          delete audioRefs.current[trackId];
        }
      }
    });

  }, [remoteStreams, speakerMuted]);

  // 스피커 음소거 상태 업데이트
  useEffect(() => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.volume = speakerMuted ? 0 : 1;
        console.log(`🔊 원격 오디오 볼륨 설정: ${speakerMuted ? '음소거' : '정상'}`);
      }
    });
  }, [speakerMuted]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      console.log('🧹 RemoteAudioPlayer 정리 중...');
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.srcObject = null;
          // DOM에서 제거
          if (audio.parentNode) {
            audio.parentNode.removeChild(audio);
          }
        }
      });
      audioRefs.current = {};
    };
  }, []);

  // 사용자 상호작용이 필요한 경우 안내 메시지 표시
  if (needsUserInteraction) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>음성을 들으려면 페이지를 클릭하세요</span>
        </div>
      </div>
    );
  }

  // 이 컴포넌트는 기본적으로 UI를 렌더링하지 않음 (오디오만 처리)
  return null;
};

export default RemoteAudioPlayer;