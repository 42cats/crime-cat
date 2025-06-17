import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ServerInfo } from '../services/websocketService';
import { serverApiService, CreateServerRequest, JoinServerRequest } from '../services/serverApi';

interface ServerListPageProps {}

export const ServerListPage: React.FC<ServerListPageProps> = () => {
  const navigate = useNavigate();
  const { servers, addServer, setServers } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 서버 목록 로드
  useEffect(() => {
    const loadServers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 공개 서버 목록과 내 서버 목록을 병렬로 로드
        const [publicServersResponse, myServers] = await Promise.all([
          serverApiService.getPublicServers(0, 50),
          serverApiService.getMyServers()
        ]);

        // 중복 제거하여 서버 목록 합치기
        const allServers = [...myServers];
        publicServersResponse.content.forEach(publicServer => {
          if (!myServers.find(myServer => myServer.id === publicServer.id)) {
            allServers.push(publicServer);
          }
        });

        setServers(allServers);
      } catch (error) {
        console.error('서버 목록 로드 실패:', error);
        setError('서버 목록을 불러오는데 실패했습니다.');
        setServers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadServers();
  }, [setServers]);

  // 서버 검색 필터링
  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleServerConnect = (server: ServerInfo) => {
    if (server.hasPassword) {
      // 비밀번호가 있는 서버는 인증 모달 표시
      setShowJoinModal(true);
      // TODO: 선택된 서버 정보 저장
    } else {
      // 비밀번호가 없는 서버는 바로 접속
      navigate(`/servers/${server.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">🎙️ Voice Chat 서버</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              다양한 주제의 서버에 참여하여 실시간 음성 채팅을 즐겨보세요
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* 검색 및 액션 바 */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* 검색 */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="서버 검색..."
              className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>서버 만들기</span>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>서버 참가</span>
            </button>
          </div>
        </div>

        {/* 서버 목록 */}
        {isLoading ? (
          <ServerListSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onConnect={() => handleServerConnect(server)}
              />
            ))}
          </div>
        )}

        {/* 에러 표시 */}
        {error && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-red-400 mb-2">
              오류가 발생했습니다
            </h3>
            <p className="text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 검색 결과 없음 */}
        {!isLoading && !error && filteredServers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-400">
              다른 검색어를 시도하거나 새로운 서버를 만들어보세요
            </p>
          </div>
        )}
      </div>

      {/* 서버 생성 모달 */}
      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onServerCreated={(server) => {
            addServer(server);
            setShowCreateModal(false);
            navigate(`/servers/${server.id}`);
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
            navigate(`/servers/${server.id}`);
          }}
        />
      )}
    </div>
  );
};

interface ServerCardProps {
  server: ServerInfo;
  onConnect: () => void;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, onConnect }) => {
  const membershipRate = (server.memberCount / server.maxMembers) * 100;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all hover:shadow-lg">
      {/* 서버 헤더 */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* 서버 아이콘 */}
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
              {server.name.charAt(0)}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white flex items-center">
                {server.name}
                {server.hasPassword && (
                  <svg className="w-4 h-4 text-yellow-400 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              </h3>
              <div className="flex items-center text-sm text-gray-400 mt-1">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                {server.memberCount.toLocaleString()} / {server.maxMembers.toLocaleString()} 멤버
              </div>
            </div>
          </div>
        </div>

        {/* 서버 설명 */}
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
          {server.description || '서버 설명이 없습니다.'}
        </p>

        {/* 멤버 참여율 바 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>참여율</span>
            <span>{membershipRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                membershipRate > 90 ? 'bg-red-500' :
                membershipRate > 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${membershipRate}%` }}
            />
          </div>
        </div>

        {/* 접속 버튼 */}
        <button
          onClick={onConnect}
          disabled={server.memberCount >= server.maxMembers}
          className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          {server.memberCount >= server.maxMembers ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>서버 만원</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>서버 접속</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const ServerListSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6).fill(0).map((_, index) => (
        <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-5 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-700 rounded animate-pulse w-2/3" />
            </div>
          </div>
          <div className="h-4 bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 bg-gray-700 rounded animate-pulse mb-4 w-3/4" />
          <div className="h-2 bg-gray-700 rounded-full animate-pulse mb-4" />
          <div className="h-12 bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const createData: CreateServerRequest = {
        name: serverName,
        description: serverDescription || undefined,
        password: password || undefined,
        maxMembers: maxMembers
      };
      
      const newServer = await serverApiService.createServer(createData);
      onServerCreated(newServer);
    } catch (error: any) {
      console.error('서버 생성 실패:', error);
      setError(error.message || '서버 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              최대 멤버 수
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              min="2"
              max="2000"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-lg p-3">
              {error}
            </div>
          )}

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverId.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const serverIdNum = Number(serverId);
      if (isNaN(serverIdNum)) {
        throw new Error('올바른 서버 ID를 입력해주세요.');
      }

      const joinData: JoinServerRequest = {
        serverId: serverIdNum,
        password: password || undefined
      };
      
      // 서버 참가 요청
      await serverApiService.joinServer(joinData);
      
      // 서버 정보 조회
      const serverInfo = await serverApiService.getServerById(serverIdNum);
      onServerJoined(serverInfo);
    } catch (error: any) {
      console.error('서버 참가 실패:', error);
      setError(error.message || '서버 참가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              서버 ID 또는 초대 링크 *
            </label>
            <input
              type="text"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-indigo-500"
              placeholder="123 또는 https://mystery-place.com/invite/..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
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

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-lg p-3">
              {error}
            </div>
          )}

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

export default ServerListPage;