import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useServerChannel } from '../../hooks/useServerChannel';
import { useVoiceChatSFU, useVoiceSessionCleanup } from '../../hooks/useVoiceChatSFU';
import { ChannelInfo } from '../../services/websocketService';
import websocketService from '../../services/websocketService';

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
  const { joinVoiceChannel, leaveVoiceChannel } = useVoiceChatSFU();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 브라우저 종료 시 세션 정리 활성화
  useVoiceSessionCleanup();

  const currentServerInfo = servers.find(s => s.id === currentServer);
  const serverChannels = currentServer ? channels[currentServer] || [] : [];

  const handleChannelClick = async (channelId: string) => {
    if (!currentServer) return;
    
    // 클릭한 채널 정보 가져오기
    const clickedChannel = serverChannels.find(c => c.id === channelId);
    if (!clickedChannel) return;

    console.log('🎯 Clicking channel:', channelId, 'type:', clickedChannel.type, 'in server:', currentServer);

    try {
      if (clickedChannel.type === 'VOICE') {
        // 음성 채널인 경우 바로 음성채널에 접속 (채팅방 전환 없음)
        console.log('🎤 Joining voice channel:', channelId);
        await joinVoiceChannel(currentServer, channelId);
        // 음성 채널은 setCurrentChannel 호출하지 않음 (채팅방 전환 방지)
        console.log('✅ Voice channel join request sent');
      } else {
        // 텍스트 채널인 경우 기존 로직
        if (currentChannel?.channelId === channelId) return;

        // 이전 채널에서 나가기
        if (currentChannel) {
          console.log('👋 Leaving previous channel:', currentChannel.channelId);
          leaveChannel(currentChannel.serverId, currentChannel.channelId);
        }

        // 새 채널에 입장
        console.log('🚀 Joining text channel:', channelId);
        joinChannel(currentServer, channelId);
        setCurrentChannel({ serverId: currentServer, channelId });
        console.log('✅ Text channel join request sent');
      }
    } catch (error) {
      console.error('❌ Failed to join channel:', error);
      if (clickedChannel.type === 'VOICE') {
        alert('음성 채널 연결에 실패했습니다. 마이크 권한을 확인해주세요.');
      }
    }
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
          channels={serverChannels.filter(c => c.type === 'TEXT')}
          currentChannelId={currentChannel?.channelId}
          onChannelClick={handleChannelClick}
          isVoiceSection={false}
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          }
        />

        {/* 음성 채널 섹션 */}
        <VoiceChannelSection
          title="음성 채널"
          channels={serverChannels.filter(c => c.type === 'VOICE')}
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
  currentChannelId?: string;
  onChannelClick: (channelId: string) => void;
  isVoiceSection: boolean;
  icon: React.ReactNode;
}

interface VoiceChannelSectionProps {
  title: string;
  channels: ChannelInfo[];
  currentChannelId?: string;
  onChannelClick: (channelId: string) => void;
  icon: React.ReactNode;
}

const ChannelSection: React.FC<ChannelSectionProps> = ({
  title,
  channels,
  currentChannelId,
  onChannelClick,
  isVoiceSection,
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
        {channel.type === 'VOICE' && channel.memberCount > 0 && (
          <span className="text-xs text-gray-400 ml-1">
            {channel.memberCount}
          </span>
        )}

        {/* 설정 버튼 */}
        <div
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white ml-1 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: 채널 설정 모달 열기
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
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

// Discord 스타일 음성 채널 섹션 (참여중인 사용자 표시)
const VoiceChannelSection: React.FC<VoiceChannelSectionProps> = ({
  title,
  channels,
  currentChannelId,
  onChannelClick,
  icon
}) => {
  const { voiceUsers, isVoiceConnected, currentServer, currentVoiceChannel } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 디버그 로그
  console.log('🔍 VoiceChannelSection 디버그:', {
    voiceUsers: voiceUsers,
    voiceUsersLength: voiceUsers?.length,
    isVoiceConnected: isVoiceConnected,
    currentServer,
    currentVoiceChannel,
    channels: channels.map(c => ({ id: c.id, name: c.name }))
  });
  

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
            <VoiceChannelItem
              key={channel.id}
              channel={channel}
              isActive={false}
              isConnected={isVoiceConnected && currentVoiceChannel?.channelId === channel.id}
              voiceUsers={Array.isArray(voiceUsers) ? voiceUsers.filter(user => {
                // 실제로 음성 채널에 접속되어 있을 때만 사용자 표시
                const isCurrentlyConnectedToVoice = isVoiceConnected && currentVoiceChannel?.channelId === channel.id;
                
                // 채널 ID 비교
                const channelMatches = user.channelId === channel.id;
                
                // 서버 ID 비교
                const serverMatches = user.serverId === currentServer;
                
                console.log(`🔍 사용자 필터링 ${user.username}:`, {
                  userChannelId: user.channelId,
                  targetChannelId: channel.id,
                  channelMatches,
                  userServerId: user.serverId,
                  targetServerId: currentServer,
                  serverMatches,
                  isCurrentlyConnectedToVoice,
                  result: channelMatches && serverMatches && isCurrentlyConnectedToVoice
                });
                
                // 실제로 해당 음성 채널에 접속되어 있을 때만 사용자 표시
                return channelMatches && serverMatches && isCurrentlyConnectedToVoice;
              }) : []}
              onClick={() => onChannelClick(channel.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Discord 스타일 음성 채널 아이템
interface VoiceChannelItemProps {
  channel: ChannelInfo;
  isActive: boolean;
  isConnected: boolean;
  voiceUsers: any[];
  onClick: () => void;
}

const VoiceChannelItem: React.FC<VoiceChannelItemProps> = ({ 
  channel, 
  isActive, 
  isConnected,
  voiceUsers,
  onClick 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // 디버깅용 로그
  console.log(`🎯 VoiceChannelItem [${channel.name}]:`, {
    channelId: channel.id,
    voiceUsers: voiceUsers,
    voiceUsersLength: voiceUsers.length,
    isActive,
    isConnected,
    userDetails: voiceUsers.map(u => ({ 
      id: u.id, 
      userId: u.userId, 
      username: u.username, 
      channelId: u.channelId, 
      serverId: u.serverId 
    }))
  });
  

  return (
    <div className="relative">
      {/* 채널 버튼 */}
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
        <span className={`text-gray-400 mr-2 ${isConnected ? 'text-green-400' : ''}`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824z" clipRule="evenodd" />
          </svg>
        </span>
        <span className="flex-1 truncate text-sm">{channel.name}</span>
        
        {/* 멤버 수 표시 */}
        {voiceUsers.length > 0 && (
          <span className="text-xs text-gray-400 ml-1">
            {voiceUsers.length}
          </span>
        )}

        {/* 설정 버튼 */}
        <div
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white ml-1 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: 채널 설정 모달 열기
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
      </button>

      {/* 참여중인 사용자 목록 (Discord 스타일) */}
      {voiceUsers.length > 0 && (
        <div className="ml-6 mt-1 space-y-1">
          {voiceUsers.map((user) => (
            <VoiceUserItem key={user.id || user.userId} user={user} />
          ))}
        </div>
      )}

      {/* 툴팁 */}
      {showTooltip && channel.description && (
        <div className="absolute left-full top-0 z-50 ml-2 bg-black text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          <div className="font-semibold">{channel.name}</div>
          <div className="text-sm text-gray-300">{channel.description}</div>
          <div className="text-xs text-gray-400 mt-1">
            {voiceUsers.length > 0 ? `${voiceUsers.length}명 참여중` : '참여자 없음'}
          </div>
        </div>
      )}
    </div>
  );
};

// Discord 스타일 음성 채널 참여 사용자 아이템
interface VoiceUserItemProps {
  user: any;
}

const VoiceUserItem: React.FC<VoiceUserItemProps> = ({ user }) => {
  return (
    <div className={`flex items-center px-2 py-1 text-sm transition-all duration-300 ${
      user.isSpeaking ? 'text-green-400' : 'text-gray-400'
    }`}>
      {/* 사용자 아바타 */}
      <div className={`relative w-4 h-4 rounded-full mr-2 flex items-center justify-center text-xs transition-all duration-300 ${
        user.isSpeaking 
          ? 'bg-green-400 text-white ring-2 ring-green-400 ring-opacity-50 animate-pulse' 
          : 'bg-gray-600 text-gray-300'
      }`}>
        {user.username?.charAt(0).toUpperCase() || 'U'}
        
        {/* 말하는 중 애니메이션 파동 효과 */}
        {user.isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
            <div className="absolute inset-0 rounded-full bg-green-400 animate-pulse opacity-50"></div>
          </>
        )}
      </div>

      {/* 사용자명 */}
      <span className={`flex-1 truncate transition-all duration-300 ${
        user.isSpeaking ? 'font-medium' : ''
      }`}>
        {user.username || 'Unknown User'}
      </span>

      {/* 상태 아이콘들 */}
      <div className="flex items-center space-x-1 ml-1">
        {user.isMuted && (
          <svg className="w-3 h-3 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0017.542 11H16.5a8.002 8.002 0 01-11.532-2.226L3.707 2.293z" clipRule="evenodd" />
          </svg>
        )}
        {user.isDeafened && (
          <svg className="w-3 h-3 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        )}
        {user.isScreenSharing && (
          <svg className="w-3 h-3 text-blue-400 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 3a1 1 0 000 2h.01a1 1 0 100-2H5zm0 3a1 1 0 000 2h6a1 1 0 100-2H5z" clipRule="evenodd" />
          </svg>
        )}
        
        {/* 말하는 중 마이크 아이콘 */}
        {user.isSpeaking && !user.isMuted && (
          <svg className="w-3 h-3 text-green-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
};

const UserInfoBar: React.FC = () => {
  const { isVoiceConnected, currentChannel, channels, currentServer, localMuted } = useAppStore();
  const { leaveVoiceChannel, toggleMute, currentVoiceChannel } = useVoiceChatSFU();
  const [showSettings, setShowSettings] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);

  // 현재 음성 채널 정보 가져오기
  const voiceChannelInfo = currentServer && currentVoiceChannel && channels[currentServer]?.find(
    c => c.id === currentVoiceChannel.channelId && c.type === 'VOICE'
  );
  const channelName = voiceChannelInfo?.name || currentVoiceChannel?.channelId || '음성 채널';

  const handleLeaveVoice = () => {
    leaveVoiceChannel();
  };

  const handleToggleSpeaker = () => {
    setSpeakerMuted(!speakerMuted);
    const audioElements = document.querySelectorAll('audio[data-remote-audio]');
    audioElements.forEach((audio: any) => {
      audio.volume = speakerMuted ? 1 : 0;
    });
  };

  return (
    <div className="bg-gray-900 border-t border-gray-700">
      {/* 음성채널 접속 상태 표시 */}
      {isVoiceConnected && (
        <div className="px-2 py-1 bg-green-600/20 border-b border-green-600/30 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824z" clipRule="evenodd" />
              <path d="M11.5 7.5a2.5 2.5 0 000 5m2.5-7a5 5 0 000 10" />
            </svg>
            <span className="text-green-400 text-sm font-medium">음성에 연결됨</span>
            <span className="text-gray-300 text-sm ml-1">— {channelName}</span>
          </div>
          <button
            onClick={handleLeaveVoice}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600/30 rounded transition-colors"
            title="음성 채널 나가기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 사용자 정보 바 */}
      <div className="h-14 flex items-center px-2">
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
          onClick={toggleMute}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            localMuted 
              ? 'text-red-400 hover:text-red-300 bg-red-600/20 hover:bg-red-600/30' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title={localMuted ? '음소거 해제' : '음소거'}
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
    </div>
  );
};

interface CreateChannelModalProps {
  serverId: string;
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
  const [channelType, setChannelType] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [maxMembers, setMaxMembers] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    setIsLoading(true);
    try {
      console.log('🚀 Creating channel via API...');
      const serverApiService = (await import('../../services/serverApi')).default;
      
      const newChannel = await serverApiService.createChannel(serverId, {
        name: channelName,
        description: channelDescription || undefined,
        type: channelType,
        maxMembers: maxMembers
      });
      
      console.log('✅ Channel created successfully:', newChannel);
      
      onChannelCreated(newChannel);
    } catch (error: any) {
      console.error('❌ 채널 생성 실패:', error);
      if (error.response?.data?.message) {
        alert(`채널 생성 실패: ${error.response.data.message}`);
      } else {
        alert('채널 생성에 실패했습니다. 권한을 확인해주세요.');
      }
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
                { value: 'VOICE', label: '음성 채널', icon: '🔊' }
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