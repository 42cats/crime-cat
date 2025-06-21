import React, { useEffect, useRef } from 'react';

interface RemoteAudioPlayerProps {
  remoteStreams: { [trackId: string]: MediaStream };
  speakerMuted?: boolean;
}

/**
 * 원격 오디오 스트림을 재생하는 컴포넌트
 * 각 원격 사용자의 오디오를 자동으로 재생
 */
export const RemoteAudioPlayer: React.FC<RemoteAudioPlayerProps> = ({ 
  remoteStreams, 
  speakerMuted = false 
}) => {
  const audioRefs = useRef<{ [trackId: string]: HTMLAudioElement }>({});

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
        
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.playsInline = true;
        audio.muted = speakerMuted;
        audio.volume = speakerMuted ? 0 : 1;
        
        // data attribute 추가 (스피커 음소거 제어용)
        audio.setAttribute('data-remote-audio', 'true');
        audio.setAttribute('data-track-id', trackId);
        
        // 오디오 재생 시작
        audio.play()
          .then(() => {
            console.log(`✅ 원격 오디오 재생 시작: ${trackId}`);
          })
          .catch(error => {
            console.warn(`⚠️ 원격 오디오 재생 실패: ${trackId}`, error);
            // 사용자 상호작용이 필요한 경우 나중에 재시도
            audio.muted = true;
            audio.play().catch(e => console.error('오디오 재생 완전 실패:', e));
          });
        
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
        }
      });
      audioRefs.current = {};
    };
  }, []);

  // 이 컴포넌트는 UI를 렌더링하지 않음 (오디오만 처리)
  return null;
};

export default RemoteAudioPlayer;