import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Download, Shield } from "lucide-react";
import { audioService } from "@/services/AudioService";
import { audioManager } from "@/services/AudioManager";

interface SmartAudioPlayerProps {
  src: string;
  title?: string;
  isPrivate?: boolean;
  duration?: number;
  className?: string;
}

/**
 * 스마트 오디오 플레이어 컴포넌트
 * - JWT 인증 기반 스트리밍
 * - 다운로드 방지
 * - 반응형 디자인
 */
const SmartAudioPlayer: React.FC<SmartAudioPlayerProps> = ({
  src,
  title: _title,
  isPrivate = false,
  duration,
  className = ""
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const componentIdRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Fetch audio data when src changes - 새로운 참조 카운팅 API 사용
  useEffect(() => {
    // 이전 오디오 정리 (새로운 src로 변경 시)
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }

    // 이전 참조 해제
    if (componentIdRef.current) {
      audioService.releaseReference(componentIdRef.current);
      componentIdRef.current = null;
    }
    
    if (!src) {
      setLoading(false);
      setObjectUrl(null);
      return;
    }

    let isCancelled = false;

    const fetchAudio = async () => {
      setLoading(true);
      setError(null);
      setObjectUrl(null);

      try {
        // 이미 blob URL인 경우 직접 사용 (레거시 지원)
        if (src.startsWith('blob:')) {
          if (!isCancelled) {
            setObjectUrl(src);
            setLoading(false);
          }
          return;
        }

        // 새로운 참조 카운팅 API 사용
        const result = await audioService.getAudioBlobUrl(src);
        
        if (!isCancelled) {
          componentIdRef.current = result.componentId;
          setObjectUrl(result.blobUrl);
          setLoading(false);
          
        } else {
          // 취소된 경우 참조 즉시 해제
          audioService.releaseReference(result.componentId);
        }
      } catch (err) {
        console.error("❌ SmartAudioPlayer - Failed to fetch audio:", err);
        if (!isCancelled) {
          // 더 친화적인 에러 메시지
          const errorMsg = err instanceof Error && err.message.includes('메모리') 
            ? "시스템 메모리 부족으로 잠시 후 다시 시도해주세요"
            : "오디오를 가져오는 데 실패했습니다. 잠시 후 다시 시도해주세요.";
          setError(errorMsg);
          setLoading(false);
        }
      }
    };

    // 지연 초기화로 메모리 안정화 대기 (프로덕션 최적화)
    const delayTimer = setTimeout(() => {
      if (!isCancelled) {
        fetchAudio();
      }
    }, 200); // 200ms 지연으로 초기 메모리 압박 회피

    return () => {
      isCancelled = true;
      clearTimeout(delayTimer);
      
      // 참조 카운팅 해제 (Zero-Latency 정리 트리거)
      if (componentIdRef.current) {
        audioService.releaseReference(componentIdRef.current);
        componentIdRef.current = null;
      }
      
      // 오디오 엘리먼트 완전 정리
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        audio.load();
      }
    };
  }, [src]);

  // 컴포넌트 언마운트 시 전체 정리
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        
        // AudioManager에서 제거
        audioManager.clearAudio(audio);
        
        // 오디오 엘리먼트 완전 정리
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        audio.load();
      }
      
      // 참조 카운팅 최종 해제 (안전장치)
      if (componentIdRef.current) {
        audioService.releaseReference(componentIdRef.current);
        componentIdRef.current = null;
      }
    };
  }, []); // 빈 의존성 배열 - 언마운트 시에만 실행

  // Manage audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
      setLoading(false);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // 재생 완료 시 AudioManager에서도 제거
      audioManager.clearAudio(audio);
    };
    const handleError = () => {
      setError("오디오 로드 중 오류가 발생했습니다. 새로고침해주세요.");
      setLoading(false);
      
      // 5초 후 자동 재시도
      setTimeout(() => {
        if (audioRef.current && !audioRef.current.src) {
          setError(null);
          setLoading(true);
          // 재시도 로직은 fetchAudio를 다시 호출하는 방식으로 구현 가능
        }
      }, 5000);
    };
    
    // 다른 오디오에 의해 재생이 중단되었을 때 상태 동기화
    const handlePause = () => {
      if (!audioManager.isCurrentAudio(audio)) {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !objectUrl) {
      return;
    }


    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // 다른 오디오 재생 중단 후 새로운 오디오 재생
        audioManager.setCurrentAudio(audio, src);
        await audio.play();
        
        setIsPlaying(true);
        setError(null); // Clear previous errors on successful play
      }
    } catch (err) {
      console.error("❌ SmartAudioPlayer - Playback failed:", err);
      
      // 에러 유형별 메시지
      let errorMessage = "재생에 실패했습니다.";
      
      if (err instanceof Error) {
        if (err.message.includes('NotAllowedError')) {
          errorMessage = "브라우저에서 오디오 재생을 차단했습니다. 페이지를 클릭한 후 다시 시도해주세요.";
        } else if (err.message.includes('NotSupportedError')) {
          errorMessage = "지원되지 않는 오디오 형식입니다.";
        } else if (err.message.includes('메모리')) {
          errorMessage = "시스템 메모리 부족으로 잠시 후 다시 시도해주세요.";
        }
      }
      
      setError(errorMessage);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm ${className}`}>
      {/* 오디오 엘리먼트 (숨김) */}
      <audio
        ref={audioRef}
        src={objectUrl || ''}
        preload="metadata"
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()} // 우클릭 방지
      />

      {/* 헤더 - 제목 숨김 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          {isPrivate && (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-gray-500">비공개</span>
            </div>
          )}
        </div>
        
        {error && (
          <span className="text-xs text-red-500 ml-2">
            {error}
          </span>
        )}
      </div>

      {/* 컨트롤 버튼들 */}
      <div className="flex items-center gap-3 mb-3">
        {/* 재생/일시정지 버튼 */}
        <button
          onClick={togglePlayPause}
          disabled={loading || !!error}
          className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full transition-colors"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        {/* 시간 표시 */}
        <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
          <span className="whitespace-nowrap">
            {formatTime(currentTime)}
          </span>
          <span>/</span>
          <span className="whitespace-nowrap">
            {formatTime(audioDuration)}
          </span>
        </div>

        {/* 볼륨 컨트롤 */}
        <div className="hidden sm:flex items-center gap-2 ml-auto">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="relative">
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={audioDuration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          disabled={!audioDuration || loading}
          className="absolute top-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      {/* 다운로드 방지 안내 */}
      <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
        <Download className="w-3 h-3" />
        <span>스트리밍 전용 - 다운로드 불가</span>
      </div>
    </div>
  );
};

export default SmartAudioPlayer;