import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from '../../services/websocketService';

interface ChatAreaProps {
  className?: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ className = '' }) => {
  const {
    currentServer,
    currentChannel,
    getChannelMessages,
    servers,
    channels
  } = useAppStore();

  const { isTyping } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const currentServerInfo = servers.find(s => s.id === currentServer);
  const currentChannelInfo = currentServer && currentChannel 
    ? channels[currentServer]?.find(c => c.id === currentChannel.channelId)
    : null;

  const messages = currentServer && currentChannel 
    ? getChannelMessages(currentServer, currentChannel.channelId)
    : [];

  // 자동 스크롤 관리
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 새 메시지가 오면 스크롤
  useEffect(() => {
    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages.length, showScrollButton]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!currentServer || !currentChannel) {
    return (
      <div className={`flex-1 flex items-center justify-center bg-gray-700 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold mb-2">채팅을 시작해보세요!</h2>
          <p>서버와 채널을 선택하여 대화에 참여하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col bg-gray-700 ${className}`}>
      {/* 채널 헤더 */}
      <div className="h-12 bg-gray-800 border-b border-gray-600 flex items-center px-4 shadow-sm">
        <div className="flex items-center">
          <ChannelIcon type={currentChannelInfo?.type || 'TEXT'} />
          <h2 className="text-white font-semibold ml-2">
            {currentChannelInfo?.name || '채널'}
          </h2>
          {currentChannelInfo?.description && (
            <>
              <div className="w-px h-6 bg-gray-600 mx-3" />
              <span className="text-gray-400 text-sm">
                {currentChannelInfo.description}
              </span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center space-x-2">
          {/* 멤버 수 */}
          <div className="flex items-center text-gray-400 text-sm">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            {currentChannelInfo?.memberCount || 0}
          </div>

          {/* 검색 버튼 */}
          <button
            className="text-gray-400 hover:text-white"
            title="메시지 검색"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* 알림 설정 */}
          <button
            className="text-gray-400 hover:text-white"
            title="알림 설정"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-lg font-semibold mb-1">
                {currentChannelInfo?.name} 채널에 오신 것을 환영합니다!
              </h3>
              <p className="text-sm">첫 번째 메시지를 보내보세요.</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              showAvatar={shouldShowAvatar(messages, index)}
              showTimestamp={shouldShowTimestamp(messages, index)}
            />
          ))
        )}

        {/* 타이핑 인디케이터 */}
        {Object.entries(isTyping).some(([_, typing]) => typing) && (
          <TypingIndicator isTyping={isTyping} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 스크롤 하단 버튼 */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface ChannelIconProps {
  type: 'TEXT' | 'VOICE';  // Phase 1에서 BOTH 제거
}

const ChannelIcon: React.FC<ChannelIconProps> = ({ type }) => {
  switch (type) {
    case 'TEXT':
      return (
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      );
    case 'VOICE':
      return (
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
};

interface MessageItemProps {
  message: ChatMessage;
  showAvatar: boolean;
  showTimestamp: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  showAvatar, 
  showTimestamp 
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  const formatDate = (timestamp: Date) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return '오늘';
    } else {
      return new Intl.DateTimeFormat('ko-KR', {
        month: 'long',
        day: 'numeric'
      }).format(messageDate);
    }
  };

  return (
    <div
      className={`group relative ${showAvatar ? 'mt-4' : 'mt-0.5'}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* 날짜 구분선 */}
      {showTimestamp && (
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-600" />
          <div className="px-3 text-xs text-gray-400 bg-gray-700 rounded">
            {formatDate(message.timestamp)}
          </div>
          <div className="flex-1 h-px bg-gray-600" />
        </div>
      )}

      <div className="flex">
        {/* 아바타 */}
        <div className="w-10 flex justify-center">
          {showAvatar ? (
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {message.username.charAt(0).toUpperCase()}
            </div>
          ) : (
            <span className="text-xs text-gray-500 leading-6 opacity-0 group-hover:opacity-100">
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>

        {/* 메시지 내용 */}
        <div className="flex-1 ml-3 min-w-0">
          {showAvatar && (
            <div className="flex items-baseline mb-1">
              <span className="font-semibold text-white">
                {message.serverProfile?.displayName || message.username}
              </span>
              
              {/* 역할 배지 */}
              {message.serverProfile?.roles && message.serverProfile.roles.length > 0 && (
                <div className="ml-2 flex space-x-1">
                  {message.serverProfile.roles.slice(0, 3).map((role) => (
                    <span
                      key={role.id}
                      className="px-1.5 py-0.5 text-xs rounded"
                      style={{ 
                        backgroundColor: role.color + '20', 
                        color: role.color 
                      }}
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              )}

              <span className="ml-2 text-xs text-gray-400">
                {formatTime(message.timestamp)}
              </span>

              {/* 버퍼된 메시지 표시 */}
              {message.buffered && (
                <span className="ml-2 text-xs text-yellow-400" title="전송 중">
                  ⏳
                </span>
              )}
            </div>
          )}

          {/* 메시지 텍스트 */}
          <div className="text-gray-300 leading-relaxed break-words">
            {message.type === 'emoji' ? (
              <span className="text-2xl">{message.content}</span>
            ) : message.type === 'gif' ? (
              <img 
                src={message.content} 
                alt="GIF" 
                className="max-w-xs rounded"
              />
            ) : (
              <MessageContent content={message.content} />
            )}
          </div>
        </div>

        {/* 메시지 옵션 */}
        {showOptions && (
          <div className="absolute -top-2 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg flex">
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-l-lg"
              title="이모지 추가"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700"
              title="답장"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-r-lg"
              title="더보기"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface MessageContentProps {
  content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  // URL 감지 및 링크 변환
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

interface TypingIndicatorProps {
  isTyping: { [userId: string]: boolean };
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping }) => {
  const typingUsers = Object.entries(isTyping)
    .filter(([_, typing]) => typing)
    .map(([userId]) => userId);

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="w-10 flex justify-center">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      <div className="ml-3 text-sm text-gray-400 italic">
        {typingUsers.length === 1 
          ? `${typingUsers[0]}님이 입력 중...`
          : `${typingUsers.length}명이 입력 중...`
        }
      </div>
    </div>
  );
};

// 헬퍼 함수들
const shouldShowAvatar = (messages: ChatMessage[], index: number): boolean => {
  if (index === 0) return true;
  
  const currentMessage = messages[index];
  const previousMessage = messages[index - 1];
  
  // 다른 사용자이거나 5분 이상 간격이 있으면 아바타 표시
  const timeDiff = new Date(currentMessage.timestamp).getTime() - new Date(previousMessage.timestamp).getTime();
  const fiveMinutes = 5 * 60 * 1000;
  
  return currentMessage.userId !== previousMessage.userId || timeDiff > fiveMinutes;
};

const shouldShowTimestamp = (messages: ChatMessage[], index: number): boolean => {
  if (index === 0) return true;
  
  const currentMessage = messages[index];
  const previousMessage = messages[index - 1];
  
  // 다른 날짜면 타임스탬프 표시
  const currentDate = new Date(currentMessage.timestamp).toDateString();
  const previousDate = new Date(previousMessage.timestamp).toDateString();
  
  return currentDate !== previousDate;
};