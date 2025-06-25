import React, { useState, useEffect } from 'react';
import { useVoiceChatSFU } from '../hooks/useVoiceChatSFU';
import cloudflareProxyService from '../services/cloudflareProxyService';
import websocketService from '../services/websocketService';

export const VoiceChatDemo: React.FC = () => {
  const [userId, setUserId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`);
  const [username, setUsername] = useState(`User_${Math.random().toString(36).substr(2, 5)}`);
  const [testChannelId] = useState('demo-voice-channel');
  const [testServerId] = useState('demo-server');

  const {
    voiceUsers,
    isVoiceConnected,
    localMuted,
    localStream,
    remoteStreams,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute
  } = useVoiceChatSFU();

  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // Cloudflare 서비스 상태 확인
    const status = cloudflareProxyService.getStatus();
    setServiceStatus(status);

    // WebSocket 연결 상태 체크
    const checkWsConnection = () => {
      setWsConnected(websocketService.isConnected());
    };

    // 초기 체크
    checkWsConnection();

    // 주기적 체크 (1초마다)
    const interval = setInterval(checkWsConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleJoin = async () => {
    try {
      console.log(`🎮 데모 사용자 ${username} (${userId}) 음성 채널 참가 시도`);
      await joinVoiceChannel(testServerId, testChannelId);
    } catch (error) {
      console.error('음성 채널 참가 실패:', error);
      alert(`음성 채널 참가 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleLeave = () => {
    console.log(`🎮 데모 사용자 ${username} (${userId}) 음성 채널 퇴장`);
    leaveVoiceChannel();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🎤 Cloudflare SFU 음성 채팅 데모
        </h1>

        {/* 서비스 상태 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔧 서비스 상태</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Cloudflare 설정:</span>
              <span className={`ml-2 ${serviceStatus?.configured ? 'text-green-400' : 'text-red-400'}`}>
                {serviceStatus?.configured ? '✅ 완료' : '❌ 미설정'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">활성 세션:</span>
              <span className="ml-2 text-blue-400">{serviceStatus?.activeSessions || 0}개</span>
            </div>
            <div>
              <span className="text-gray-400">Base URL:</span>
              <span className="ml-2 text-gray-300 text-xs">{serviceStatus?.baseUrl}</span>
            </div>
            <div>
              <span className="text-gray-400">WebSocket:</span>
              <span className={`ml-2 ${wsConnected ? 'text-green-400' : 'text-gray-400'}`}>
                {wsConnected ? '🟢 연결됨' : '⚪ 연결 안됨'}
              </span>
            </div>
          </div>
        </div>

        {/* 사용자 설정 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 사용자 설정</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">사용자 ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={isVoiceConnected}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">사용자 이름</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isVoiceConnected}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* 음성 채널 제어 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎵 음성 채널 제어</h2>
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              {!isVoiceConnected ? (
                <button
                  onClick={handleJoin}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  🎤 음성 채널 참가
                </button>
              ) : (
                <div className="space-x-4">
                  <button
                    onClick={toggleMute}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      localMuted
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {localMuted ? '🔇 음소거 해제' : '🔊 음소거'}
                  </button>
                  <button
                    onClick={handleLeave}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    🚪 음성 채널 나가기
                  </button>
                </div>
              )}
            </div>

            {/* 로컬 스트림 상태 */}
            {localStream && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>로컬 오디오 스트림 활성</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 참가자 목록 */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">👥 참가자 목록 ({voiceUsers.length}명)</h2>
          
          {voiceUsers.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              아직 참가자가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {voiceUsers.map((user) => {
                const trackId = user.trackId || `audio_${user.id || user.userId}`;
                const hasRemoteStream = !!remoteStreams[trackId];
                
                return (
                  <div
                    key={user.id || user.userId}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-400">
                          ID: {user.id || user.userId}
                        </div>
                        {user.trackId && (
                          <div className="text-xs text-blue-400">
                            Track: {user.trackId}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {user.isMuted ? (
                        <span className="text-red-400 text-sm">🔇 음소거</span>
                      ) : (
                        <span className="text-green-400 text-sm">🔊 활성</span>
                      )}
                      
                      {hasRemoteStream ? (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                          📡 스트림 수신
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                          ⏳ 스트림 대기
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 디버그 정보 */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">🔍 디버그 정보</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>서버 ID: {testServerId}</div>
            <div>채널 ID: {testChannelId}</div>
            <div>원격 스트림 수: {Object.keys(remoteStreams).length}개</div>
            <div>원격 스트림 키: {Object.keys(remoteStreams).join(', ') || '없음'}</div>
          </div>
        </div>

        {/* 사용법 */}
        <div className="mt-6 bg-blue-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">📖 사용법</h3>
          <ol className="text-sm space-y-2">
            <li>1. 여러 브라우저 탭/창에서 이 페이지를 열어보세요</li>
            <li>2. 각 탭에서 다른 사용자 이름으로 음성 채널에 참가하세요</li>
            <li>3. 마이크 권한을 허용하고 음성 채팅을 테스트하세요</li>
            <li>4. 개발자 도구 콘솔에서 상세한 로그를 확인할 수 있습니다</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatDemo;