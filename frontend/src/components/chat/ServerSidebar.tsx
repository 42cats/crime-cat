import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useServerChannel } from '../../hooks/useServerChannel';
import { ServerInfo } from '../../services/websocketService';

interface ServerSidebarProps {
  className?: string;
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({ className = '' }) => {
  const {
    servers,
    currentServer,
    setCurrentServer,
    addServer
  } = useAppStore();
  
  const { joinServer, leaveServer } = useServerChannel();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleServerClick = (serverId: number) => {
    if (currentServer === serverId) return;
    
    if (currentServer) {
      leaveServer(currentServer);
    }
    
    joinServer(serverId);
    setCurrentServer(serverId);
  };

  return (
    <div className={`w-16 bg-gray-900 flex flex-col items-center py-3 space-y-2 ${className}`}>
      {/* 서버 목록 */}
      <div className="flex flex-col space-y-2 flex-1 overflow-y-auto">
        {servers.map((server) => (
          <ServerIcon
            key={server.id}
            server={server}
            isActive={currentServer === server.id}
            onClick={() => handleServerClick(server.id)}
          />
        ))}
      </div>

      {/* 구분선 */}
      <div className="w-8 h-0.5 bg-gray-600 rounded-full" />

      {/* 서버 추가 버튼들 */}
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 bg-gray-700 hover:bg-green-600 rounded-full flex items-center justify-center text-green-500 hover:text-white transition-all duration-200 group"
          title="서버 만들기"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        <button
          onClick={() => setShowJoinModal(true)}
          className="w-12 h-12 bg-gray-700 hover:bg-blue-600 rounded-full flex items-center justify-center text-blue-500 hover:text-white transition-all duration-200"
          title="서버 참가하기"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* 서버 생성 모달 */}
      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onServerCreated={(server) => {
            addServer(server);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* 서버 참가 모달 */}
      {showJoinModal && (
        <JoinServerModal
          onClose={() => setShowJoinModal(false)}
          onServerJoined={(server) => {
            addServer(server);
            setShowJoinModal(false);
          }}
        />
      )}
    </div>
  );
};

interface ServerIconProps {
  server: ServerInfo;
  isActive: boolean;
  onClick: () => void;
}

const ServerIcon: React.FC<ServerIconProps> = ({ server, isActive, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold transition-all duration-200 relative overflow-hidden
          ${isActive 
            ? 'bg-indigo-600 rounded-2xl' 
            : 'bg-gray-700 hover:bg-indigo-600 hover:rounded-2xl'
          }
        `}
      >
        {/* 서버 이니셜 또는 아이콘 */}
        <span className="text-sm">
          {server.name.charAt(0).toUpperCase()}
        </span>

        {/* 활성 표시기 */}
        {isActive && (
          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
        )}

        {/* 알림 배지 (예시) */}
        {server.memberCount > 50 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white">!</span>
          </div>
        )}
      </button>

      {/* 툴팁 */}
      {showTooltip && (
        <div className="absolute left-16 top-0 z-50 bg-black text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          <div className="font-semibold">{server.name}</div>
          <div className="text-sm text-gray-300">
            {server.memberCount}/{server.maxMembers} 멤버
          </div>
          {server.hasPassword && (
            <div className="text-xs text-yellow-400 flex items-center mt-1">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              비밀번호 보호
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CreateServerModalProps {
  onClose: () => void;
  onServerCreated: (server: ServerInfo) => void;
}

const CreateServerModal: React.FC<CreateServerModalProps> = ({ onClose, onServerCreated }) => {
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [password, setPassword] = useState('');
  const [maxMembers, setMaxMembers] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) return;

    setIsLoading(true);
    try {
      console.log('🚀 Creating new server...');
      const serverApiService = (await import('../../services/serverApi')).default;
      const newServer = await serverApiService.createServer({
        name: serverName,
        description: serverDescription || undefined,
        password: password || undefined,
        maxMembers: maxMembers
      });
      console.log('✅ Server created:', newServer);
      
      onServerCreated(newServer);
    } catch (error) {
      console.error('❌ 서버 생성 실패:', error);
      alert('서버 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">서버 만들기</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              서버 이름 *
            </label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-indigo-500"
              placeholder="멋진 서버 이름"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              서버 설명
            </label>
            <textarea
              value={serverDescription}
              onChange={(e) => setServerDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-indigo-500"
              placeholder="서버에 대한 간단한 설명"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              서버 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-indigo-500"
              placeholder="비워두면 공개 서버"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              최대 멤버 수
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              min="2"
              max="1000"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !serverName.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
            >
              {isLoading ? '생성 중...' : '서버 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface JoinServerModalProps {
  onClose: () => void;
  onServerJoined: (server: ServerInfo) => void;
}

const JoinServerModal: React.FC<JoinServerModalProps> = ({ onClose, onServerJoined }) => {
  const [serverId, setServerId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverId.trim()) return;

    setIsLoading(true);
    try {
      console.log('🚀 Joining server:', serverId);
      const serverApiService = (await import('../../services/serverApi')).default;
      
      // 먼저 서버 정보를 가져옴
      const server = await serverApiService.getServerById(serverId);
      
      // 서버 참가 시도
      await serverApiService.joinServer({
        serverId: serverId,
        password: password || undefined
      });
      
      console.log('✅ Successfully joined server:', server);
      onServerJoined(server);
    } catch (error: any) {
      console.error('❌ 서버 참가 실패:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('서버 참가에 실패했습니다. 서버 ID를 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">서버 참가하기</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              서버 ID 또는 초대 링크 *
            </label>
            <input
              type="text"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-indigo-500"
              placeholder="123 또는 https://discord.gg/..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              서버 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-indigo-500"
              placeholder="비밀번호가 있다면 입력"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !serverId.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
            >
              {isLoading ? '참가 중...' : '서버 참가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};