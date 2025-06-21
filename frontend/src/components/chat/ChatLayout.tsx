import React from 'react';
import { ServerSidebar } from './ServerSidebar';
import { ChannelSidebar } from './ChannelSidebar';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { VoiceBar } from './VoiceBar';
import { MemberList } from './MemberList';
import { RemoteAudioPlayer } from '../voice/RemoteAudioPlayer';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAppStore } from '../../store/useAppStore';
import { useVoiceChatSFU } from '../../hooks/useVoiceChatSFU';

interface ChatLayoutProps {
  className?: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ className = '' }) => {
  const { isConnected } = useWebSocket();
  const { isVoiceConnected } = useAppStore();
  const { remoteStreams } = useVoiceChatSFU();

  return (
    <div className={`h-screen flex bg-gray-900 relative ${className}`}>
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
      <div className={`flex-1 flex flex-col ${isVoiceConnected ? 'pb-16' : ''}`}>
        {/* 채팅 영역 */}
        <ChatArea className="flex-1" />

        {/* VoiceArea 제거 - VoiceBar가 모든 음성 기능 처리 */}

        {/* 채팅 입력 */}
        <ChatInput />
      </div>

      {/* 멤버 목록 */}
      <MemberList />

      {/* Discord 스타일 VoiceBar (음성 채널 연결시 화면 하단 고정) */}
      <VoiceBar />

      {/* 원격 오디오 재생 (UI 없음, 오디오만 처리) */}
      <RemoteAudioPlayer remoteStreams={remoteStreams} />
    </div>
  );
};

export default ChatLayout;