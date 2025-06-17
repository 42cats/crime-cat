import React from 'react';
import { ServerSidebar } from './ServerSidebar';
import { ChannelSidebar } from './ChannelSidebar';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { VoiceArea } from './VoiceArea';
import { MemberList } from './MemberList';
import { useWebSocket } from '../../hooks/useWebSocket';

interface ChatLayoutProps {
  className?: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ className = '' }) => {
  const { isConnected } = useWebSocket();

  return (
    <div className={`h-screen flex bg-gray-900 ${className}`}>
      {/* 연결 상태 표시 */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-600 text-white text-center py-2 z-50">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>서버에 연결 중...</span>
          </div>
        </div>
      )}

      {/* 서버 사이드바 */}
      <ServerSidebar />

      {/* 채널 사이드바 */}
      <ChannelSidebar />

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 채팅 영역 */}
        <ChatArea className="flex-1" />

        {/* 음성 영역 (조건부 표시) */}
        <VoiceArea />

        {/* 채팅 입력 */}
        <ChatInput />
      </div>

      {/* 멤버 목록 */}
      <MemberList />
    </div>
  );
};

export default ChatLayout;