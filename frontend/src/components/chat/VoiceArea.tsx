import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { VoiceUser } from '../../services/websocketService';

interface VoiceAreaProps {
  className?: string;
}

export const VoiceArea: React.FC<VoiceAreaProps> = ({ className = '' }) => {
  const {
    currentServer,
    currentChannel,
    channels,
    isVoiceConnected,
    localMuted,
    voiceUsers
  } = useAppStore();

  const {
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    currentVoiceChannel,
    localStream,
    remoteStreams
  } = useVoiceChat();

  const [isConnecting, setIsConnecting] = useState(false);

  const currentChannelInfo = currentServer && currentChannel 
    ? channels[currentServer]?.find(c => c.id === currentChannel.channelId)
    : null;

  const canUseVoice = currentChannelInfo?.type === 'VOICE' || currentChannelInfo?.type === 'BOTH';

  const handleJoinVoice = async () => {
    if (!currentServer || !currentChannel || !canUseVoice) return;

    setIsConnecting(true);
    try {
      await joinVoiceChannel(currentServer, currentChannel.channelId);
    } catch (error) {
      console.error('음성 채널 참가 실패:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLeaveVoice = () => {
    leaveVoiceChannel();
  };

  if (!canUseVoice) {
    return null; // 음성을 지원하지 않는 채널에서는 표시하지 않음
  }

  return (
    <div className={`bg-gray-800 border-t border-gray-600 ${className}`}>
      {!isVoiceConnected ? (
        // 음성 채널 참가 전
        <VoiceJoinPrompt
          channelName={currentChannelInfo?.name || '음성 채널'}
          isConnecting={isConnecting}
          onJoin={handleJoinVoice}
        />
      ) : (
        // 음성 채널 참가 후
        <VoiceActiveArea
          channelName={currentChannelInfo?.name || '음성 채널'}
          voiceUsers={voiceUsers}
          localMuted={localMuted}
          localStream={localStream}
          remoteStreams={remoteStreams}
          onToggleMute={toggleMute}
          onLeave={handleLeaveVoice}
        />
      )}
    </div>
  );
};

interface VoiceJoinPromptProps {
  channelName: string;
  isConnecting: boolean;
  onJoin: () => void;
}

const VoiceJoinPrompt: React.FC<VoiceJoinPromptProps> = ({
  channelName,
  isConnecting,
  onJoin
}) => {
  return (
    <div className="p-4">
      <div className="bg-gray-700 rounded-lg p-4 text-center">
        <div className="text-4xl mb-3">🎤</div>
        <h3 className="text-white font-semibold mb-2">
          {channelName}에서 음성 채팅
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          음성 채널에 참가하여 실시간으로 대화하세요
        </p>
        <button
          onClick={onJoin}
          disabled={isConnecting}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>연결 중...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              <span>음성 채널 참가</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface VoiceActiveAreaProps {
  channelName: string;
  voiceUsers: VoiceUser[];
  localMuted: boolean;
  localStream: MediaStream | null;
  remoteStreams: { [userId: string]: MediaStream };
  onToggleMute: () => void;
  onLeave: () => void;
}

const VoiceActiveArea: React.FC<VoiceActiveAreaProps> = ({
  channelName,
  voiceUsers,
  localMuted,
  localStream,
  remoteStreams,
  onToggleMute,
  onLeave
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="p-4">
      {/* 음성 채널 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
          <h3 className="text-white font-medium">🔊 {channelName}</h3>
        </div>
        <button
          onClick={onLeave}
          className="text-gray-400 hover:text-red-400 transition-colors"
          title="음성 채널 나가기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* 참가자 목록 */}
      <div className="space-y-2 mb-4">
        {/* 로컬 사용자 */}
        <VoiceUserCard
          user={{
            id: 'local',
            username: '나',
            serverId: 0,
            channelId: 0,
            volume: 100,
            isMuted: localMuted,
            isConnected: true
          }}
          isLocal={true}
          stream={localStream}
        />

        {/* 원격 사용자들 */}
        {voiceUsers.map((user) => (
          <VoiceUserCard
            key={user.id}
            user={user}
            isLocal={false}
            stream={remoteStreams[user.id]}
          />
        ))}
      </div>

      {/* 음성 컨트롤 */}
      <div className="flex justify-center space-x-3">
        {/* 마이크 토글 */}
        <button
          onClick={onToggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            localMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          title={localMuted ? '마이크 켜기' : '마이크 끄기'}
        >
          {localMuted ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0017.542 11H16.5a8.002 8.002 0 01-11.532-2.226L3.707 2.293zM7.022 6.464L8.5 7.942V8a1.5 1.5 0 003 0V6.464l1.478 1.478A3.5 3.5 0 0110 12.5c-.941 0-1.799-.37-2.431-.971l-1.478-1.478A5.5 5.5 0 013.5 8H2.458c0 .437.044.869.128 1.287l1.372 1.372A8.015 8.015 0 007.022 6.464zM10 3a3.5 3.5 0 00-3.5 3.5v.7L10 10.7V3z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* 스피커 토글 */}
        <button
          className="w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
          title="스피커 설정"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824zm2.617 5.347a1 1 0 011.414 0 5 5 0 010 7.071 1 1 0 11-1.414-1.414 3 3 0 000-4.243 1 1 0 010-1.414zm2.829-2.829a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* 설정 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
          title="음성 설정"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* 음성 설정 패널 */}
      {showSettings && (
        <VoiceSettingsPanel
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

interface VoiceUserCardProps {
  user: VoiceUser;
  isLocal: boolean;
  stream?: MediaStream;
}

const VoiceUserCard: React.FC<VoiceUserCardProps> = ({ user, isLocal, stream }) => {
  const [volume, setVolume] = useState(0);

  // 음성 레벨 시뮬레이션 (실제 구현에서는 WebRTC에서 가져옴)
  useEffect(() => {
    if (!stream || user.isMuted) {
      setVolume(0);
      return;
    }

    const interval = setInterval(() => {
      setVolume(Math.random() * 100);
    }, 100);

    return () => clearInterval(interval);
  }, [stream, user.isMuted]);

  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
      <div className="flex items-center space-x-3">
        {/* 사용자 아바타 */}
        <div className="relative">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          
          {/* 음성 레벨 표시 */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center">
            {user.isMuted ? (
              <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0017.542 11H16.5a8.002 8.002 0 01-11.532-2.226L3.707 2.293z" clipRule="evenodd" />
              </svg>
            ) : volume > 30 ? (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            ) : (
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
            )}
          </div>
        </div>

        {/* 사용자 정보 */}
        <div>
          <div className="text-white text-sm font-medium">
            {user.username} {isLocal && '(나)'}
          </div>
          {user.isScreenSharing && (
            <div className="text-xs text-blue-400 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 3a1 1 0 000 2h.01a1 1 0 100-2H5zm0 3a1 1 0 000 2h6a1 1 0 100-2H5z" clipRule="evenodd" />
              </svg>
              화면 공유 중
            </div>
          )}
        </div>
      </div>

      {/* 음성 레벨 바 */}
      <div className="flex items-center space-x-2">
        <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              user.isMuted ? 'bg-red-400' : 'bg-green-400'
            }`}
            style={{ width: user.isMuted ? '0%' : `${Math.min(volume, 100)}%` }}
          />
        </div>
        
        {!isLocal && (
          <button
            className="text-gray-400 hover:text-white"
            title="사용자 설정"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

interface VoiceSettingsPanelProps {
  onClose: () => void;
}

const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({ onClose }) => {
  const [micVolume, setMicVolume] = useState(80);
  const [speakerVolume, setSpeakerVolume] = useState(90);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">음성 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* 마이크 설정 */}
          <div>
            <h3 className="text-white font-medium mb-3">마이크</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">마이크 볼륨</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={micVolume}
                  onChange={(e) => setMicVolume(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0%</span>
                  <span>{micVolume}%</span>
                  <span>100%</span>
                </div>
              </div>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={noiseSuppression}
                  onChange={(e) => setNoiseSuppression(e.target.checked)}
                  className="mr-3"
                />
                <span className="text-gray-300">노이즈 억제</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={echoCancellation}
                  onChange={(e) => setEchoCancellation(e.target.checked)}
                  className="mr-3"
                />
                <span className="text-gray-300">에코 제거</span>
              </label>
            </div>
          </div>

          {/* 스피커 설정 */}
          <div>
            <h3 className="text-white font-medium mb-3">스피커</h3>
            <div>
              <label className="block text-sm text-gray-300 mb-1">스피커 볼륨</label>
              <input
                type="range"
                min="0"
                max="100"
                value={speakerVolume}
                onChange={(e) => setSpeakerVolume(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>{speakerVolume}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* 테스트 버튼들 */}
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
              마이크 테스트
            </button>
            <button className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors">
              스피커 테스트
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};