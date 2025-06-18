import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useServerChannel } from '../../hooks/useServerChannel';
import { ChannelInfo } from '../../services/websocketService';

interface ChannelSidebarProps {
  className?: string;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({ className = '' }) => {
  const {
    currentServer,
    currentChannel,
    channels,
    servers,
    setCurrentChannel,
    addChannel,
    setChannels
  } = useAppStore();

  const { joinChannel, leaveChannel } = useServerChannel();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const currentServerInfo = servers.find(s => s.id === currentServer);
  const serverChannels = currentServer ? channels[currentServer] || [] : [];

  const handleChannelClick = (channelId: number) => {
    if (!currentServer) return;
    
    if (currentChannel?.channelId === channelId) return;

    // 이전 채널에서 나가기
    if (currentChannel) {
      leaveChannel(currentChannel.serverId, currentChannel.channelId);
    }

    // 새 채널에 입장
    joinChannel(currentServer, channelId);
    setCurrentChannel({ serverId: currentServer, channelId });
  };

  // 서버가 변경되면 채널 목록 로드
  useEffect(() => {
    const loadChannels = async () => {
      if (currentServer && serverChannels.length === 0) {
        try {
          console.log('📡 Loading channels for server:', currentServer);
          const serverApiService = (await import('../../services/serverApi')).default;
          const channels = await serverApiService.getServerChannels(currentServer);
          console.log('✅ Loaded channels:', channels);
          setChannels(currentServer, channels);
        } catch (error) {
          console.error('❌ Failed to load channels:', error);
          // 에러 시 기본 채널 생성
          const defaultChannel: ChannelInfo = {
            id: '00000000-0000-4000-8000-000000000001',
            serverId: currentServer,
            name: '일반',
            description: '일반적인 대화를 위한 채널',
            type: 'TEXT',
            memberCount: 0,
            maxMembers: 100
          };
          setChannels(currentServer, [defaultChannel]);
        }
      }
    };
    
    loadChannels();
  }, [currentServer, serverChannels.length, setChannels]);

  if (!currentServer) {
    return (
      <div className={`w-60 bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">🏠</div>
          <div>서버를 선택해주세요</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-60 bg-gray-800 flex flex-col ${className}`}>
      {/* 서버 헤더 */}
      <div className="h-12 border-b border-gray-700 flex items-center px-4 shadow-md">
        <h1 className="text-white font-semibold truncate">
          {currentServerInfo?.name || '서버'}
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="ml-auto text-gray-400 hover:text-white"
          title="채널 만들기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* 채널 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* 텍스트 채널 섹션 */}
        <ChannelSection
          title="텍스트 채널"
          channels={serverChannels.filter(c => c.type === 'TEXT' || c.type === 'BOTH')}
          currentChannelId={currentChannel?.channelId}
          onChannelClick={handleChannelClick}
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          }
        />

        {/* 음성 채널 섹션 */}
        <ChannelSection
          title="음성 채널"
          channels={serverChannels.filter(c => c.type === 'VOICE' || c.type === 'BOTH')}
          currentChannelId={currentChannel?.channelId}
          onChannelClick={handleChannelClick}
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824zm2.617 5.347a1 1 0 011.414 0 5 5 0 010 7.071 1 1 0 11-1.414-1.414 3 3 0 000-4.243 1 1 0 010-1.414zm2.829-2.829a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          }
        />
      </div>

      {/* 사용자 정보 바 */}
      <UserInfoBar />

      {/* 채널 생성 모달 */}
      {showCreateModal && (
        <CreateChannelModal
          serverId={currentServer}
          onClose={() => setShowCreateModal(false)}
          onChannelCreated={(channel) => {
            addChannel(currentServer, channel);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

interface ChannelSectionProps {
  title: string;
  channels: ChannelInfo[];
  currentChannelId?: number;
  onChannelClick: (channelId: number) => void;
  icon: React.ReactNode;
}

const ChannelSection: React.FC<ChannelSectionProps> = ({
  title,
  channels,
  currentChannelId,
  onChannelClick,
  icon
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="mb-4">
      {/* 섹션 헤더 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center w-full text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 hover:text-gray-300"
      >
        <svg
          className={`w-3 h-3 mr-1 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        {icon}
        <span className="ml-1">{title}</span>
      </button>

      {/* 채널 목록 */}
      {!isCollapsed && (
        <div className="space-y-0.5">
          {channels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={currentChannelId === channel.id}
              onClick={() => onChannelClick(channel.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ChannelItemProps {
  channel: ChannelInfo;
  isActive: boolean;
  onClick: () => void;
}

const ChannelItem: React.FC<ChannelItemProps> = ({ channel, isActive, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getChannelIcon = () => {
    switch (channel.type) {
      case 'TEXT':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      case 'VOICE':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824z" clipRule="evenodd" />
          </svg>
        );
      case 'BOTH':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-full flex items-center px-2 py-1 rounded text-left transition-colors group
          ${isActive 
            ? 'bg-gray-600 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }
        `}
      >
        <span className="text-gray-400 mr-2">{getChannelIcon()}</span>
        <span className="flex-1 truncate text-sm">{channel.name}</span>
        
        {/* 멤버 수 표시 (음성 채널용) */}
        {(channel.type === 'VOICE' || channel.type === 'BOTH') && channel.memberCount > 0 && (
          <span className="text-xs text-gray-400 ml-1">
            {channel.memberCount}
          </span>
        )}

        {/* 설정 버튼 */}
        <button
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white ml-1"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: 채널 설정 모달 열기
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </button>

      {/* 툴팁 */}
      {showTooltip && channel.description && (
        <div className="absolute left-full top-0 z-50 ml-2 bg-black text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          <div className="font-semibold">{channel.name}</div>
          <div className="text-sm text-gray-300">{channel.description}</div>
          <div className="text-xs text-gray-400 mt-1">
            {channel.memberCount}/{channel.maxMembers} 멤버
          </div>
        </div>
      )}
    </div>
  );
};

const UserInfoBar: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="h-14 bg-gray-900 border-t border-gray-700 flex items-center px-2">
      {/* 사용자 아바타 및 정보 */}
      <div className="flex items-center flex-1 min-w-0">
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          U
        </div>
        <div className="ml-2 min-w-0">
          <div className="text-white text-sm font-medium truncate">사용자명</div>
          <div className="text-gray-400 text-xs truncate">#1234</div>
        </div>
      </div>

      {/* 컨트롤 버튼들 */}
      <div className="flex items-center space-x-1">
        {/* 마이크 토글 */}
        <button
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="마이크 토글"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>

        {/* 헤드폰 토글 */}
        <button
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="헤드폰 토글"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        </button>

        {/* 설정 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="설정"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface CreateChannelModalProps {
  serverId: number;
  onClose: () => void;
  onChannelCreated: (channel: ChannelInfo) => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  serverId,
  onClose,
  onChannelCreated
}) => {
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [channelType, setChannelType] = useState<'TEXT' | 'VOICE' | 'BOTH'>('TEXT');
  const [maxMembers, setMaxMembers] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    setIsLoading(true);
    try {
      // TODO: API 호출로 채널 생성
      const newChannel: ChannelInfo = {
        id: Date.now(), // 임시 ID
        serverId,
        name: channelName,
        description: channelDescription || undefined,
        type: channelType,
        memberCount: 0,
        maxMembers
      };
      
      onChannelCreated(newChannel);
    } catch (error) {
      console.error('채널 생성 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">채널 만들기</h2>
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
              채널 유형
            </label>
            <div className="space-y-2">
              {[
                { value: 'TEXT', label: '텍스트 채널', icon: '💬' },
                { value: 'VOICE', label: '음성 채널', icon: '🔊' },
                { value: 'BOTH', label: '텍스트 + 음성', icon: '🎥' }
              ].map((type) => (
                <label key={type.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value={type.value}
                    checked={channelType === type.value}
                    onChange={(e) => setChannelType(e.target.value as any)}
                    className="mr-3"
                  />
                  <span className="mr-2">{type.icon}</span>
                  <span className="text-gray-300">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              채널 이름 *
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-indigo-500"
              placeholder="새로운-채널"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              채널 설명
            </label>
            <textarea
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-indigo-500"
              placeholder="이 채널의 용도를 설명해주세요"
              rows={2}
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
              min="1"
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
              disabled={isLoading || !channelName.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
            >
              {isLoading ? '생성 중...' : '채널 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};