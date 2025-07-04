import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useServerChannel } from '../hooks/useServerChannel';
import { useWebSocket } from '../hooks/useWebSocket';
import { useChannelLeaveCleanup } from '../hooks/useChannelLeaveCleanup';
import { useVoiceSessionCleanup } from '../hooks/useVoiceChatSFU';
import { ChatLayout } from '../components/chat/ChatLayout';
import { serverApiService } from '../services/serverApi';

interface ServerPageProps {}

export const ServerPage: React.FC<ServerPageProps> = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  
  const {
    servers,
    currentServer,
    setCurrentServer,
    setCurrentChannel
  } = useAppStore();
  
  const { joinServer, leaveServer, joinChannel } = useServerChannel();
  const { isConnected } = useWebSocket();
  
  // 채널/서버 이탈 시 음성 세션 자동 정리
  useChannelLeaveCleanup();
  
  // 브라우저 종료/페이지 이탈 시 음성 세션 정리
  useVoiceSessionCleanup();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serverInfo = servers.find(s => s.id === serverId);

  // 서버 정보 로드 및 접속 처리
  useEffect(() => {
    const handleServerAccess = async () => {
      if (!serverId) {
        setError('잘못된 서버 ID입니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // WebSocket 연결 확인
        console.log('🔌 Checking WebSocket connection...');
        console.log('Initial connection state:', isConnected);
        
        if (!isConnected) {
          console.log('⏳ Waiting for WebSocket connection...');
          // WebSocket 연결 대기
          const connected = await new Promise((resolve) => {
            const interval = setInterval(() => {
              console.log('🔄 Connection check:', isConnected);
              if (isConnected) {
                clearInterval(interval);
                resolve(true);
              }
            }, 100);
            
            // 10초 타임아웃
            setTimeout(() => {
              console.log('⏰ WebSocket connection timeout');
              clearInterval(interval);
              resolve(false);
            }, 10000);
          });
          
          if (!connected) {
            throw new Error('Signal Server 연결에 실패했습니다. Docker 컨테이너가 실행 중인지 확인해주세요.');
          }
        }

        console.log('✅ WebSocket connected, proceeding with server join');

        // 서버 정보가 없으면 로드
        if (!serverInfo) {
          try {
            const loadedServerInfo = await serverApiService.getServerById(serverId);
            // 스토어에 서버 정보 추가
            const { addServer } = useAppStore.getState();
            addServer(loadedServerInfo);
          } catch (error) {
            console.error('서버 정보 로드 실패:', error);
            throw new Error('서버 정보를 불러올 수 없습니다.');
          }
        }

        // 서버가 비밀번호를 요구하는지 확인
        if (serverInfo?.hasPassword) {
          // TODO: 이미 인증된 서버인지 확인
          setShowPasswordModal(true);
          setIsLoading(false);
          return;
        }

        // 서버 접속 시도
        await attemptServerJoin(serverId);
        
      } catch (error) {
        console.error('서버 접속 실패:', error);
        setError(error instanceof Error ? error.message : '서버 접속에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    handleServerAccess();
  }, [serverId, serverInfo]); // isConnected 의존성 제거

  const attemptServerJoin = async (serverId: string, password?: string) => {
    try {
      console.log('🎯 Attempting to join server:', serverId);
      
      // STEP 1: 백엔드 API로 서버 가입 먼저! (이미 멤버여도 성공 반환)
      console.log('📡 Calling backend API to join server...');
      try {
        await serverApiService.joinServer({
          serverId: serverId,
          password: password
        });
        console.log('✅ Successfully joined/verified server membership via API');
      } catch (error: any) {
        console.error('❌ Backend API join failed:', error);
        throw new Error(error.response?.data?.message || '서버 가입에 실패했습니다.');
      }
      
      // 이전 서버에서 나가기
      if (currentServer && currentServer !== serverId) {
        console.log('👋 Leaving previous server:', currentServer);
        leaveServer(currentServer);
      }

      // STEP 2: WebSocket으로 서버 입장
      console.log('🚀 Joining server via WebSocket:', serverId);
      await joinServer(serverId);
      setCurrentServer(serverId);
      
      // 기본 채널로 이동 - 실제 API에서 기본 채널 조회 후 WebSocket으로 채널 가입
      console.log('📱 Getting default channel from API...');
      try {
        const channels = await serverApiService.getServerChannels(serverId);
        if (channels && channels.length > 0) {
          const defaultChannel = channels[0]; // 첫 번째 채널을 기본으로 사용
          
          // 먼저 스토어에 채널 설정
          setCurrentChannel({ serverId, channelId: defaultChannel.id });
          
          // WebSocket으로 채널 가입
          console.log('🚀 Joining channel via WebSocket:', defaultChannel.name, `(ID: ${defaultChannel.id})`);
          joinChannel(serverId, defaultChannel.id);
          
          console.log('✅ Default channel set and joined:', defaultChannel.name, `(ID: ${defaultChannel.id})`);
        } else {
          console.warn('⚠️ No channels found for server');
          const fallbackChannelId = '00000000-0000-4000-8000-000000000001';
          setCurrentChannel({ serverId, channelId: fallbackChannelId });
          joinChannel(serverId, fallbackChannelId);
        }
      } catch (error) {
        console.warn('⚠️ Failed to get channels, using fallback');
        const fallbackChannelId = '00000000-0000-4000-8000-000000000001';
        setCurrentChannel({ serverId, channelId: fallbackChannelId });
        joinChannel(serverId, fallbackChannelId);
      }
      
      setShowPasswordModal(false);
      setError(null);
      console.log('✅ Server join completed successfully');
      
    } catch (error) {
      console.error('❌ Server join failed:', error);
      throw error;
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!serverId) return;
    
    try {
      setIsLoading(true);
      await attemptServerJoin(serverId, password);
    } catch (error) {
      setError('비밀번호가 올바르지 않거나 서버 접속에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    if (currentServer) {
      leaveServer(currentServer);
      setCurrentServer(undefined);
      setCurrentChannel(undefined);
    }
    navigate('/servers');
  };

  // 로딩 상태
  if (isLoading) {
    return <ServerLoadingPage serverName={serverInfo?.name} />;
  }

  // 에러 상태
  if (error) {
    return (
      <ServerErrorPage 
        error={error} 
        onRetry={() => window.location.reload()}
        onBackToList={handleBackToList}
      />
    );
  }

  // 비밀번호 입력 모달
  if (showPasswordModal) {
    return (
      <ServerPasswordPage
        serverInfo={serverInfo}
        onPasswordSubmit={handlePasswordSubmit}
        onCancel={handleBackToList}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  // 메인 채팅 인터페이스
  return <ChatLayout />;
};

interface ServerLoadingPageProps {
  serverName?: string;
}

const ServerLoadingPage: React.FC<ServerLoadingPageProps> = ({ serverName }) => {
  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          {serverName || '서버'}에 접속 중...
        </h2>
        <p className="text-gray-400">
          잠시만 기다려 주세요
        </p>
      </div>
    </div>
  );
};

interface ServerErrorPageProps {
  error: string;
  onRetry: () => void;
  onBackToList: () => void;
}

const ServerErrorPage: React.FC<ServerErrorPageProps> = ({ error, onRetry, onBackToList }) => {
  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          서버 접속 실패
        </h2>
        <p className="text-gray-400 mb-6">
          {error}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={onBackToList}
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            서버 목록으로
          </button>
        </div>
      </div>
    </div>
  );
};

interface ServerPasswordPageProps {
  serverInfo?: any;
  onPasswordSubmit: (password: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

const ServerPasswordPage: React.FC<ServerPasswordPageProps> = ({
  serverInfo,
  onPasswordSubmit,
  onCancel,
  isLoading,
  error
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onPasswordSubmit(password);
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {serverInfo?.name?.charAt(0) || 'S'}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {serverInfo?.name || '서버'}
          </h2>
          <p className="text-gray-400">
            이 서버는 비밀번호로 보호되어 있습니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              서버 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="비밀번호를 입력하세요"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>접속 중...</span>
                </>
              ) : (
                <span>서버 접속</span>
              )}
            </button>
          </div>
        </form>

        {/* 서버 정보 */}
        {serverInfo && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-sm text-gray-400 space-y-2">
              {serverInfo.description && (
                <p>{serverInfo.description}</p>
              )}
              <div className="flex justify-between">
                <span>멤버 수:</span>
                <span>{serverInfo.memberCount?.toLocaleString()} / {serverInfo.maxMembers?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerPage;