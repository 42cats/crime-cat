import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useVoiceChatSFU } from '../../hooks/useVoiceChatSFU';

interface VoiceBarProps {
  className?: string;
}

/**
 * Discord 스타일 VoiceBar 컴포넌트
 * 음성 채널에 연결되었을 때 하단에 표시되는 컨트롤 바
 */
export const VoiceBar: React.FC<VoiceBarProps> = ({ className = '' }) => {
  const {
    currentServer,
    currentChannel,
    channels,
    localMuted,
    isVoiceConnected
  } = useAppStore();

  const {
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    currentVoiceChannel,
    localSpeaking,
    localStream
  } = useVoiceChatSFU();

  const [showSettings, setShowSettings] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [voiceModulationEnabled, setVoiceModulationEnabled] = useState(false);
  const [modulationType, setModulationType] = useState<'none' | 'robot' | 'pitch-shift' | 'echo'>('none');

  // 현재 채널이 음성 채널인지 확인
  const currentChannelInfo = currentServer && currentChannel 
    ? channels[currentServer]?.find(c => c.id === currentChannel.channelId)
    : null;
  
  const isInVoiceChannel = currentChannelInfo?.type === 'VOICE';

  // 디버깅용 로그
  console.log('🎙️ VoiceBar 렌더링 상태:', {
    isVoiceConnected,
    currentVoiceChannel,
    currentServer,
    currentChannelType: currentChannelInfo?.type,
    isInVoiceChannel,
    hasChannels: currentServer ? !!channels[currentServer] : false
  });

  // 음성 채널이 아니면 표시하지 않음
  if (!isInVoiceChannel) {
    console.log('🚫 VoiceBar 숨김: 음성 채널이 아님');
    return null;
  }

  // 현재 음성 채널 정보 가져오기 (안전한 처리)
  const voiceChannelInfo = currentServer && currentVoiceChannel && channels[currentServer]?.find(
    c => c.id === currentVoiceChannel.channelId && c.type === 'VOICE'
  );

  // 채널 정보가 없으면 기본값 사용 (연결 초기 단계)
  const channelName = voiceChannelInfo?.name || currentVoiceChannel?.channelId || '음성 채널';

  console.log('🎯 VoiceBar 채널 정보:', {
    voiceChannelInfo: voiceChannelInfo?.name,
    channelName,
    currentVoiceChannelId: currentVoiceChannel?.channelId
  });

  const handleJoinVoice = async () => {
    if (!currentServer || !currentChannel || !isInVoiceChannel) return;

    try {
      await joinVoiceChannel(currentServer, currentChannel.channelId);
    } catch (error) {
      console.error('음성 채널 참가 실패:', error);
      // 연결 실패 시 사용자에게 알림
      alert('음성 채널 연결에 실패했습니다. 마이크 권한을 확인해주세요.');
    }
  };

  const handleLeaveVoice = () => {
    leaveVoiceChannel();
  };

  // 스피커 음소거 토글
  const toggleSpeakerMute = () => {
    setSpeakerMuted(!speakerMuted);
    // 모든 원격 오디오 요소의 volume 제어
    const audioElements = document.querySelectorAll('audio[data-remote-audio]');
    audioElements.forEach((audio: any) => {
      audio.volume = speakerMuted ? 1 : 0;
    });
    console.log(`🔊 스피커 ${speakerMuted ? '켜기' : '음소거'}`);
  };

  // 음성 변조 토글
  const toggleVoiceModulation = () => {
    setVoiceModulationEnabled(!voiceModulationEnabled);
    if (!voiceModulationEnabled) {
      setModulationType('robot'); // 기본값으로 로봇 음성
    } else {
      setModulationType('none');
    }
    console.log(`🎭 음성 변조 ${voiceModulationEnabled ? '비활성화' : '활성화'}`);
  };

  // 음성 변조 타입 변경
  const changeModulationType = (type: 'none' | 'robot' | 'pitch-shift' | 'echo') => {
    setModulationType(type);
    setVoiceModulationEnabled(type !== 'none');
    console.log(`🎭 음성 변조 타입 변경: ${type}`);
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-700 flex items-center px-4 z-40 ${className}`}>
      {!isVoiceConnected ? (
        /* 음성 채널 참가 전 */
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="text-white text-sm font-medium">{currentChannelInfo?.name || '음성 채널'}</div>
              <div className="text-gray-400 text-xs">음성 채널에 참가하세요</div>
            </div>
          </div>
          <button
            onClick={handleJoinVoice}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
          >
            참가
          </button>
        </div>
      ) : (
        /* 음성 채널 연결됨 */
        <>
          {/* 음성 채널 정보 */}
          <div className="flex items-center flex-1 min-w-0">
            {/* 음성 채널 아이콘 및 연결 상태 */}
            <div className="flex items-center mr-3">
              <div className="relative">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824zm2.617 5.347a1 1 0 011.414 0 5 5 0 010 7.071 1 1 0 11-1.414-1.414 3 3 0 000-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {/* 연결 상태 표시 점 */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse" />
              </div>
              
              {/* 채널명 */}
              <div className="ml-2">
                <div className="text-white text-sm font-medium">{channelName}</div>
                <div className="text-green-400 text-xs">음성 연결됨</div>
              </div>
            </div>

            {/* 오디오 레벨 표시 (말하고 있을 때) */}
            {localSpeaking && localStream && (
              <div className="flex items-center ml-4">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-4 bg-green-400 rounded-full transition-all duration-100 ${
                        i < 3 ? 'animate-pulse' : ''
                      }`}
                      style={{
                        animationDelay: `${i * 100}ms`,
                        height: `${8 + (i * 2)}px`
                      }}
                    />
                  ))}
                </div>
                <span className="ml-2 text-green-400 text-xs">말하는 중</span>
              </div>
            )}
          </div>

          {/* 음성 컨트롤 버튼들 */}
          <div className="flex items-center space-x-2">
        {/* 마이크 토글 */}
        <button
          onClick={toggleMute}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            localMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : localSpeaking
              ? 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-400 ring-opacity-50'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          title={localMuted ? '마이크 켜기' : '마이크 끄기'}
        >
          {localMuted ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0017.542 11H16.5a8.002 8.002 0 01-11.532-2.226L3.707 2.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* 스피커 음소거 토글 */}
        <button
          onClick={toggleSpeakerMute}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            speakerMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          title={speakerMuted ? '스피커 켜기' : '스피커 음소거'}
        >
          {speakerMuted ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824zm2.617 5.347a1 1 0 011.414 0 5 5 0 010 7.071 1 1 0 11-1.414-1.414 3 3 0 000-4.243 1 1 0 010-1.414zm2.829-2.829a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* 음성 변조 토글 */}
        <button
          onClick={toggleVoiceModulation}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            voiceModulationEnabled
              ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-400 ring-opacity-50'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          title={voiceModulationEnabled ? '음성 변조 비활성화' : '음성 변조 활성화'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </button>

        {/* 음성 설정 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
          title="음성 설정"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-600 mx-2" />

            {/* 연결 해제 */}
            <button
              onClick={handleLeaveVoice}
              className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
              title="음성 채널 나가기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m0 0l3 3m-3-3l3-3" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* 음성 설정 패널 */}
      {showSettings && (
        <VoiceSettingsPanel
          onClose={() => setShowSettings(false)}
          speakerMuted={speakerMuted}
          onSpeakerMuteChange={setSpeakerMuted}
          voiceModulationEnabled={voiceModulationEnabled}
          onVoiceModulationChange={setVoiceModulationEnabled}
          modulationType={modulationType}
          onModulationTypeChange={changeModulationType}
        />
      )}
    </div>
  );
};

interface VoiceSettingsPanelProps {
  onClose: () => void;
  speakerMuted: boolean;
  onSpeakerMuteChange: (muted: boolean) => void;
  voiceModulationEnabled: boolean;
  onVoiceModulationChange: (enabled: boolean) => void;
  modulationType: 'none' | 'robot' | 'pitch-shift' | 'echo';
  onModulationTypeChange: (type: 'none' | 'robot' | 'pitch-shift' | 'echo') => void;
}

const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({ 
  onClose, 
  speakerMuted, 
  onSpeakerMuteChange,
  voiceModulationEnabled,
  onVoiceModulationChange,
  modulationType,
  onModulationTypeChange
}) => {
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
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={speakerMuted}
                  onChange={(e) => onSpeakerMuteChange(e.target.checked)}
                  className="mr-3"
                />
                <span className="text-gray-300">스피커 음소거</span>
              </label>

              <div>
                <label className="block text-sm text-gray-300 mb-1">스피커 볼륨</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={speakerVolume}
                  onChange={(e) => setSpeakerVolume(Number(e.target.value))}
                  disabled={speakerMuted}
                  className="w-full disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0%</span>
                  <span>{speakerMuted ? '음소거' : `${speakerVolume}%`}</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 음성 변조 설정 */}
          <div>
            <h3 className="text-white font-medium mb-3">음성 변조</h3>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceModulationEnabled}
                  onChange={(e) => onVoiceModulationChange(e.target.checked)}
                  className="mr-3"
                />
                <span className="text-gray-300">음성 변조 활성화</span>
              </label>

              {voiceModulationEnabled && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">변조 타입</label>
                  <div className="space-y-2">
                    {[
                      { value: 'robot', label: '🤖 로봇 음성', description: '기계적인 음성으로 변조' },
                      { value: 'pitch-shift', label: '🎵 음높이 변경', description: '음성의 높낮이 조절' },
                      { value: 'echo', label: '🔄 에코 효과', description: '메아리 효과 추가' }
                    ].map((type) => (
                      <label key={type.value} className="flex items-start cursor-pointer p-2 rounded hover:bg-gray-700">
                        <input
                          type="radio"
                          value={type.value}
                          checked={modulationType === type.value}
                          onChange={(e) => onModulationTypeChange(e.target.value as any)}
                          className="mr-3 mt-1"
                        />
                        <div>
                          <div className="text-gray-300 font-medium">{type.label}</div>
                          <div className="text-xs text-gray-400">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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

export default VoiceBar;