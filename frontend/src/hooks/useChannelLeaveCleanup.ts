import { useEffect } from 'react';
import { useVoiceChatSFU } from './useVoiceChatSFU';
import { useAppStore } from '../store/useAppStore';
import websocketService from '../services/websocketService';

/**
 * 채널/서버 이탈 시 음성 세션 자동 정리 Hook
 * 사용자가 음성 채널이나 채팅 채널, 서버에서 나갈 때 자동으로 음성 세션을 정리합니다.
 */
export const useChannelLeaveCleanup = () => {
  const { leaveVoiceChannel, isVoiceConnected, currentVoiceChannel } = useVoiceChatSFU();
  const currentServer = useAppStore(state => state.currentServer);
  const currentChannel = useAppStore(state => state.currentChannel);

  // 서버 변경 감지 - 다른 서버로 이동하면 현재 음성 세션 정리
  useEffect(() => {
    return () => {
      if (isVoiceConnected && currentVoiceChannel) {
        console.log('🚪 서버 변경 감지 - 음성 세션 자동 정리');
        leaveVoiceChannel();
      }
    };
  }, [currentServer]);

  // 채널 변경 감지 - 다른 채널로 이동하면 현재 음성 세션 정리
  useEffect(() => {
    return () => {
      if (isVoiceConnected && currentVoiceChannel) {
        // 현재 음성 채널과 다른 채널로 이동하는 경우에만 정리
        if (currentChannel?.channelId !== currentVoiceChannel.channelId) {
          console.log('🚪 채널 변경 감지 - 음성 세션 자동 정리');
          leaveVoiceChannel();
        }
      }
    };
  }, [currentChannel]);

  // WebSocket 연결 해제 감지 - 연결이 끊어지면 음성 세션 정리
  useEffect(() => {
    const handleDisconnection = () => {
      if (isVoiceConnected) {
        console.log('🔌 WebSocket 연결 해제 감지 - 음성 세션 자동 정리');
        leaveVoiceChannel();
      }
    };

    websocketService.on('connection:status', (data: { connected: boolean }) => {
      if (!data.connected) {
        handleDisconnection();
      }
    });

    return () => {
      websocketService.off('connection:status', handleDisconnection);
    };
  }, [isVoiceConnected, leaveVoiceChannel]);

  // 컴포넌트 언마운트 시 음성 세션 정리
  useEffect(() => {
    return () => {
      if (isVoiceConnected) {
        console.log('🗑️ 컴포넌트 언마운트 - 음성 세션 정리');
        leaveVoiceChannel();
      }
    };
  }, []);
};

export default useChannelLeaveCleanup;