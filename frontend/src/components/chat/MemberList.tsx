import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ServerRole } from '../../services/websocketService';
import websocketService from '../../services/websocketService';

interface Member {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  roles: ServerRole[];
  joinedAt: Date;
  isOwner?: boolean;
  isBot?: boolean;
  currentActivity?: string;
}

interface MemberListProps {
  className?: string;
}

export const MemberList: React.FC<MemberListProps> = ({ className = '' }) => {
  const {
    currentServer,
    currentChannel,
    servers,
    channels,
    serverRoles
  } = useAppStore();

  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showOffline, setShowOffline] = useState(true);
  const [onlineMembers, setOnlineMembers] = useState<Set<string>>(new Set());

  const currentServerInfo = servers.find(s => s.id === currentServer);
  const currentChannelInfo = currentServer && currentChannel 
    ? channels[currentServer]?.find(c => c.id === currentChannel.channelId)
    : null;

  // 멤버 목록 로드 (임시 데이터)
  useEffect(() => {
    if (!currentServer) {
      setMembers([]);
      return;
    }

    // API에서 멤버 목록 로드
    const loadMembers = async () => {
      try {
        console.log('📡 Loading members for server:', currentServer);
        const serverApiService = (await import('../../services/serverApi')).default;
        const membersData = await serverApiService.getServerMembers(currentServer);
        console.log('✅ Loaded members:', membersData);
        
        // API 응답을 Member 인터페이스에 맞게 변환
        const formattedMembers: Member[] = membersData.map((member: any) => {
          const memberId = member.userId || member.id;
          const isOnline = onlineMembers.has(memberId);
          
          return {
            id: memberId,
            username: member.effectiveDisplayName || member.username || member.user?.username || 'Unknown User',
            displayName: member.effectiveDisplayName || member.displayName || member.nickname,
            status: isOnline ? 'online' : 'offline',
            roles: member.roles || [],
            joinedAt: new Date(member.joinedAt || member.createdAt),
            isOwner: member.role === 'ADMIN' || member.isOwner,
            isBot: false,
            currentActivity: undefined
          };
        });
        
        setMembers(formattedMembers);
      } catch (error) {
        console.error('❌ Failed to load members:', error);
        setMembers([]);
      }
    };

    loadMembers();
  }, [currentServer, onlineMembers]); // onlineMembers 변경 시에도 다시 로드

  // WebSocket을 통한 실시간 온라인 상태 업데이트
  useEffect(() => {
    if (!currentServer) return;


    // 온라인 사용자 목록 초기 요청
    websocketService.requestOnlineUsers(currentServer);

    // 온라인 상태 이벤트 핸들러
    const handleUserOnline = (data: { userId: string; username: string; serverId: string }) => {
      if (data.serverId === currentServer) {
        console.log('✅ 사용자 온라인:', data.username);
        setOnlineMembers(prev => new Set([...prev, data.userId]));
      }
    };

    const handleUserOffline = (data: { userId: string; username: string; serverId: string }) => {
      if (data.serverId === currentServer) {
        console.log('❌ 사용자 오프라인:', data.username);
        setOnlineMembers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    const handleOnlineUsersList = (data: { serverId: string; users: string[] }) => {
      if (data.serverId === currentServer) {
        console.log('📋 온라인 사용자 목록 업데이트:', data.users);
        setOnlineMembers(new Set(data.users));
      }
    };

    // 이벤트 리스너 등록
    websocketService.on('user:online', handleUserOnline);
    websocketService.on('user:offline', handleUserOffline);
    websocketService.on('users:online:list', handleOnlineUsersList);

    // 서버 변경 시 온라인 목록 재요청
    const refreshInterval = setInterval(() => {
      websocketService.requestOnlineUsers(currentServer);
    }, 30000); // 30초마다 갱신

    return () => {
      websocketService.off('user:online', handleUserOnline);
      websocketService.off('user:offline', handleUserOffline);
      websocketService.off('users:online:list', handleOnlineUsersList);
      clearInterval(refreshInterval);
    };
  }, [currentServer]);

  // 멤버 필터링
  const filteredMembers = members.filter(member => {
    // 검색어 필터
    if (searchQuery && !member.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 역할 필터
    if (selectedRole !== 'all') {
      if (selectedRole === 'no-role') {
        if (member.roles.length > 0) return false;
      } else {
        if (!member.roles.some(role => role.id.toString() === selectedRole)) return false;
      }
    }

    // 오프라인 사용자 필터
    if (!showOffline && member.status === 'offline') {
      return false;
    }

    return true;
  });

  // 상태별로 그룹화
  const groupedMembers = {
    online: filteredMembers.filter(m => m.status === 'online'),
    away: filteredMembers.filter(m => m.status === 'away'),
    busy: filteredMembers.filter(m => m.status === 'busy'),
    offline: filteredMembers.filter(m => m.status === 'offline')
  };

  // 역할별로 정렬
  const sortMembersByRole = (members: Member[]) => {
    return members.sort((a, b) => {
      // 소유자 우선
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      
      // 역할 우선순위 (색상이 있는 역할이 우선)
      const aHighestRole = a.roles[0];
      const bHighestRole = b.roles[0];
      
      if (aHighestRole?.color !== bHighestRole?.color) {
        if (aHighestRole?.color && !bHighestRole?.color) return -1;
        if (!aHighestRole?.color && bHighestRole?.color) return 1;
      }

      // 이름순
      return a.username.localeCompare(b.username);
    });
  };

  if (!currentServer) {
    return (
      <div className={`w-60 bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">👥</div>
          <div>서버를 선택해주세요</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-60 bg-gray-800 flex flex-col ${className}`}>
      {/* 헤더 */}
      <div className="h-12 border-b border-gray-700 flex items-center px-4">
        <h2 className="text-white font-semibold">
          멤버 — {filteredMembers.length}
        </h2>
      </div>

      {/* 검색 및 필터 */}
      <div className="p-3 space-y-2">
        {/* 검색 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="멤버 검색"
            className="w-full px-3 py-2 pl-9 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 역할 필터 */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="all">모든 역할</option>
          <option value="no-role">역할 없음</option>
          {serverRoles.map(role => (
            <option key={role.id} value={role.id.toString()}>
              {role.name}
            </option>
          ))}
        </select>

        {/* 옵션 */}
        <label className="flex items-center text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={showOffline}
            onChange={(e) => setShowOffline(e.target.checked)}
            className="mr-2"
          />
          오프라인 사용자 표시
        </label>
      </div>

      {/* 멤버 목록 */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* 온라인 */}
        {groupedMembers.online.length > 0 && (
          <MemberGroup
            title="온라인"
            count={groupedMembers.online.length}
            members={sortMembersByRole(groupedMembers.online)}
            status="online"
          />
        )}

        {/* 자리 비움 */}
        {groupedMembers.away.length > 0 && (
          <MemberGroup
            title="자리 비움"
            count={groupedMembers.away.length}
            members={sortMembersByRole(groupedMembers.away)}
            status="away"
          />
        )}

        {/* 다른 용무 중 */}
        {groupedMembers.busy.length > 0 && (
          <MemberGroup
            title="다른 용무 중"
            count={groupedMembers.busy.length}
            members={sortMembersByRole(groupedMembers.busy)}
            status="busy"
          />
        )}

        {/* 오프라인 */}
        {showOffline && groupedMembers.offline.length > 0 && (
          <MemberGroup
            title="오프라인"
            count={groupedMembers.offline.length}
            members={sortMembersByRole(groupedMembers.offline)}
            status="offline"
          />
        )}

        {/* 검색 결과 없음 */}
        {filteredMembers.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm">검색 결과가 없습니다</div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MemberGroupProps {
  title: string;
  count: number;
  members: Member[];
  status: 'online' | 'away' | 'busy' | 'offline';
}

const MemberGroup: React.FC<MemberGroupProps> = ({ title, count, members, status }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="mb-2">
      {/* 그룹 헤더 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center w-full text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 hover:text-gray-300 py-1"
      >
        <svg
          className={`w-3 h-3 mr-1 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        {title} — {count}
      </button>

      {/* 멤버 목록 */}
      {!isCollapsed && (
        <div className="space-y-0.5">
          {members.map((member) => (
            <MemberItem
              key={member.id}
              member={member}
              status={status}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface MemberItemProps {
  member: Member;
  status: 'online' | 'away' | 'busy' | 'offline';
}

const MemberItem: React.FC<MemberItemProps> = ({ member, status }) => {
  const [showProfile, setShowProfile] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'away':
        return (
          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'busy':
        return (
          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowProfile(!showProfile)}
        className="w-full flex items-center px-2 py-1.5 rounded hover:bg-gray-700 transition-colors group text-left"
      >
        {/* 아바타 */}
        <div className="relative mr-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {member.username.charAt(0).toUpperCase()}
          </div>
          
          {/* 상태 표시 */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor()} rounded-full border-2 border-gray-800`}>
            {getStatusIcon()}
          </div>

          {/* 봇 표시 */}
          {member.isBot && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
              🤖
            </div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className={`text-sm font-medium truncate ${
              status === 'offline' ? 'text-gray-400' : 'text-white'
            }`}>
              {member.displayName || member.username}
            </span>
            
            {/* 소유자 표시 */}
            {member.isOwner && (
              <svg className="w-4 h-4 text-yellow-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>

          {/* 역할 표시 */}
          {member.roles.length > 0 && (
            <div className="flex items-center mt-0.5">
              <div
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: member.roles[0].color }}
              />
              <span className="text-xs text-gray-400 truncate">
                {member.roles[0].name}
              </span>
            </div>
          )}

          {/* 활동 상태 */}
          {member.currentActivity && (
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {member.currentActivity}
            </div>
          )}
        </div>

        {/* 더보기 버튼 */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
      </button>

      {/* 사용자 프로필 카드 */}
      {showProfile && (
        <UserProfileCard
          member={member}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};

interface UserProfileCardProps {
  member: Member;
  onClose: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ member, onClose }) => {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-profile-card')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="user-profile-card absolute left-full top-0 z-50 ml-2 w-80 bg-gray-900 rounded-lg shadow-xl border border-gray-600 overflow-hidden">
      {/* 배너 */}
      <div className="h-20 bg-gradient-to-r from-indigo-600 to-purple-600" />

      {/* 프로필 정보 */}
      <div className="p-4 -mt-8">
        {/* 아바타 */}
        <div className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold border-4 border-gray-900 mb-3">
          {member.username.charAt(0).toUpperCase()}
          {member.isBot && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full text-white text-xs flex items-center justify-center">
              🤖
            </div>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="mb-4">
          <h3 className="text-white text-lg font-bold flex items-center">
            {member.displayName || member.username}
            {member.isOwner && (
              <svg className="w-5 h-5 text-yellow-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </h3>
          <p className="text-gray-400 text-sm">@{member.username}</p>
          {member.isBot && (
            <div className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded mt-1">
              🤖 봇
            </div>
          )}
        </div>

        {/* 역할 */}
        {member.roles.length > 0 && (
          <div className="mb-4">
            <h4 className="text-gray-300 text-sm font-medium mb-2">역할</h4>
            <div className="space-y-1">
              {member.roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center px-2 py-1 rounded"
                  style={{ backgroundColor: role.color + '20' }}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="text-sm" style={{ color: role.color }}>
                    {role.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 가입일 */}
        <div className="mb-4">
          <h4 className="text-gray-300 text-sm font-medium mb-1">서버 가입일</h4>
          <p className="text-gray-400 text-sm">
            {member.joinedAt.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex space-x-2">
          <button className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors">
            메시지 보내기
          </button>
          <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors">
            더보기
          </button>
        </div>
      </div>
    </div>
  );
};