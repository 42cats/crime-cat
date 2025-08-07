import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Download, Shield } from "lucide-react";
import { audioService } from "@/services/AudioService";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Fetch audio data when src changes - blob URL인지 확인 후 AudioService 사용
  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchAudio = async () => {
      setLoading(true);
      setError(null);
      setObjectUrl(null);

      try {
        // 이미 blob URL인 경우 직접 사용
        if (src.startsWith('blob:')) {
          if (!isCancelled) {
            setObjectUrl(src);
            setLoading(false);
          }
          return;
        }

        // 일반 URL인 경우 AudioService를 통해 중복 요청 방지 및 캐싱
        const blobUrl = await audioService.getAudioBlobUrl(src);
        
        if (!isCancelled) {
          setObjectUrl(blobUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch audio:", err);
        if (!isCancelled) {
          setError("오디오를 가져오는 데 실패했습니다.");
          setLoading(false);
        }
      }
    };

    fetchAudio();

    return () => {
      isCancelled = true;
      // AudioService가 Blob URL 관리하므로 여기서는 정리하지 않음
    };
  }, [src]);

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
    };
    const handleError = () => {
      setError("오디오를 재생할 수 없습니다.");
      setLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !objectUrl) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
        setError(null); // Clear previous errors on successful play
      }
    } catch (err) {
      console.error("Playback failed:", err);
      setError("재생에 실패했습니다. 브라우저 권한을 확인해주세요.");
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