import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useVoiceChatSFU } from '../../hooks/useVoiceChatSFU';
import { AudioDeviceSelector } from '../voice/AudioDeviceSelector';
import { VoiceUser } from '../../services/websocketService';

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
    localStream,
    voiceUsers
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

  // 음성 채널이 아니면 표시하지 않음
  if (!isInVoiceChannel) {
    return null;
  }

  // 현재 음성 채널 정보 가져오기 (안전한 처리)
  const voiceChannelInfo = currentServer && currentVoiceChannel && channels[currentServer]?.find(
    c => c.id === currentVoiceChannel.channelId && c.type === 'VOICE'
  );

  // 채널 정보가 없으면 기본값 사용 (연결 초기 단계)
  const channelName = voiceChannelInfo?.name || currentVoiceChannel?.channelId || '음성 채널';

  const handleJoinVoice = async () => {
    if (!currentServer || !currentChannel || !isInVoiceChannel) return;

    try {
      await joinVoiceChannel(currentServer, currentChannel.channelId);
    } catch (error) {
      console.error('음성 채널 참가 실패:', error);
      alert('음성 채널 연결에 실패했습니다. 마이크 권한을 확인해주세요.');
    }
  };

  const handleLeaveVoice = () => {
    leaveVoiceChannel();
  };

  // 스피커 음소거 토글
  const toggleSpeakerMute = () => {
    setSpeakerMuted(!speakerMuted);
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
      setModulationType('robot');
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

  // VoiceBar를 간소화 - 고정 높이 사용
  const fixedHeight = 16; // 64px 고정 높이

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 h-16 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 z-30 transition-all duration-300 ${className}`}
    >
      {!isVoiceConnected ? (
        /* 음성 채널 참가 전 - 숨김 */
        null
      ) : (
        /* 간소화된 음성 컨트롤 바 */
        <div className="flex items-center justify-between px-4 h-full">
            {/* 왼쪽: 채널 정보 */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-green-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824z" clipRule="evenodd" />
                  <path d="M11.5 7.5a2.5 2.5 0 000 5m2.5-7a5 5 0 000 10" />
                </svg>
              </div>
              <div className="text-sm">
                <div className="text-gray-300 font-medium">음성에 연결됨</div>
                <div className="text-gray-400 text-xs">{channelName}</div>
              </div>
            </div>

            {/* 중앙: 음성 컨트롤 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-gray-700 ${
                  localMuted 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : localSpeaking 
                    ? 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-400' 
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
                title={localMuted ? '음소거 해제' : '음소거'}
              >
                {localMuted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0017.542 11H16.5a8.002 8.002 0 01-11.532-2.226L3.707 2.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setSpeakerMuted(!speakerMuted)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-gray-700 ${
                  speakerMuted 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
                title={speakerMuted ? '스피커 켜기' : '스피커 끄기'}
              >
                {speakerMuted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824z" clipRule="evenodd" />
                    <path d="M11.5 7.5a2.5 2.5 0 000 5m2.5-7a5 5 0 000 10" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-gray-700 bg-gray-600 text-gray-300"
                title="음성 설정"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            {/* 오른쪽: 연결 끊기 */}
            <div className="flex items-center">
              <button
                onClick={handleLeaveVoice}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-red-700 bg-red-600 text-white"
                title="음성 채널 나가기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
        </div>
      )}

      {/* 설정 패널 */}
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
  const [currentInputDevice, setCurrentInputDevice] = useState<string>('');
  const [currentOutputDevice, setCurrentOutputDevice] = useState<string>('');

  // 디바이스 변경 핸들러
  const handleInputDeviceChange = (deviceId: string) => {
    setCurrentInputDevice(deviceId);
    console.log('입력 디바이스 변경:', deviceId);
  };

  const handleOutputDeviceChange = (deviceId: string) => {
    setCurrentOutputDevice(deviceId);
    console.log('출력 디바이스 변경:', deviceId);
  };

  // 마이크 테스트
  const handleTestMicrophone = () => {
    console.log('마이크 테스트 시작');
  };

  // 스피커 테스트
  const handleTestSpeaker = () => {
    console.log('스피커 테스트 시작');
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGMcBSuH0PLNeSsFJHfH8N2QQAoUXrTp66hVFAo=');
    audio.play().catch(e => console.error('스피커 테스트 실패:', e));
  };

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
          {/* 오디오 디바이스 설정 */}
          <AudioDeviceSelector
            currentInputDevice={currentInputDevice}
            currentOutputDevice={currentOutputDevice}
            onInputDeviceChange={handleInputDeviceChange}
            onOutputDeviceChange={handleOutputDeviceChange}
            onTestMicrophone={handleTestMicrophone}
            onTestSpeaker={handleTestSpeaker}
          />

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
            <button 
              onClick={handleTestMicrophone}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              마이크 테스트
            </button>
            <button 
              onClick={handleTestSpeaker}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              스피커 테스트
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceBar;