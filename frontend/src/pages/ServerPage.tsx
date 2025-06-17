import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useServerChannel } from '../hooks/useServerChannel';
import { useWebSocket } from '../hooks/useWebSocket';
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
  
  const { joinServer, leaveServer } = useServerChannel();
  const { isConnected } = useWebSocket();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serverIdNum = serverId ? parseInt(serverId, 10) : null;
  const serverInfo = servers.find(s => s.id === serverIdNum);

  // 서버 정보 로드 및 접속 처리
  useEffect(() => {
    const handleServerAccess = async () => {
      if (!serverIdNum) {
        setError('잘못된 서버 ID입니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // WebSocket 연결 확인
        if (!isConnected) {
          // WebSocket 연결 대기
          await new Promise((resolve) => {
            const interval = setInterval(() => {
              if (isConnected) {
                clearInterval(interval);
                resolve(true);
              }
            }, 100);
            
            // 10초 타임아웃
            setTimeout(() => {
              clearInterval(interval);
              resolve(false);
            }, 10000);
          });
        }

        if (!isConnected) {
          throw new Error('서버 연결에 실패했습니다.');
        }

        // 서버 정보가 없으면 로드
        if (!serverInfo) {
          try {
            const loadedServerInfo = await serverApiService.getServerById(serverIdNum);
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
        await attemptServerJoin(serverIdNum);
        
      } catch (error) {
        console.error('서버 접속 실패:', error);
        setError(error instanceof Error ? error.message : '서버 접속에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    handleServerAccess();
  }, [serverIdNum, isConnected, serverInfo]);

  const attemptServerJoin = async (serverId: number, password?: string) => {
    try {
      // 이전 서버에서 나가기
      if (currentServer && currentServer !== serverId) {
        leaveServer(currentServer);
      }

      // 새 서버 접속
      await joinServer(serverId);
      setCurrentServer(serverId);
      
      // 기본 채널로 이동 (예: ID 1)
      setCurrentChannel({ serverId, channelId: 1 });
      
      setShowPasswordModal(false);
      setError(null);
      
    } catch (error) {
      console.error('서버 접속 실패:', error);
      throw error;
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!serverIdNum) return;
    
    try {
      setIsLoading(true);
      await attemptServerJoin(serverIdNum, password);
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