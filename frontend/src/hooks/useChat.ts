import { useEffect, useCallback, useState } from 'react';
import websocketService, { ChatMessage } from '../services/websocketService';
import { useAppStore } from '../store/useAppStore';
import { ChatMessage as StoreChatMessage } from '../store/useAppStore';

export interface UseChatReturn {
  messages: StoreChatMessage[];
  isTyping: { [userId: string]: boolean };
  sendMessage: (serverId: string, channelId: string, content: string, messageType?: 'text' | 'gif' | 'emoji') => void;
  sendTyping: (serverId: string, channelId: string, isTyping: boolean) => void;
  onMessageReceived: (callback: (message: ChatMessage) => void) => () => void;
  onMessageSent: (callback: (data: any) => void) => () => void;
  onTyping: (callback: (data: any) => void) => () => void;
}

export const useChat = (): UseChatReturn => {
  const { messages, addMessage, setMessages, addMessageToChannel, currentServer, currentChannel } = useAppStore();
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});
  const [typingTimeouts, setTypingTimeouts] = useState<{ [userId: string]: NodeJS.Timeout }>({});

  // Message received handler
  const handleMessageReceived = useCallback((message: ChatMessage) => {
    console.log('Message received:', message);
    
    // 메시지에 serverId와 channelId가 있으면 채널별로 저장
    if (message.serverId && message.channelId) {
      addMessageToChannel(message.serverId, message.channelId, {
        id: message.id,
        serverId: message.serverId,
        channelId: message.channelId,
        userId: message.userId,
        username: message.username,
        content: message.content,
        timestamp: new Date(message.timestamp),
        type: message.messageType || 'text',
        serverProfile: message.serverProfile,
        buffered: message.buffered
      });
    } else {
      // 폴백: 전역 메시지 배열에 추가
      addMessage({
        id: message.id,
        userId: message.userId,
        username: message.username,
        content: message.content,
        timestamp: new Date(message.timestamp),
        type: message.messageType || 'text'
      });
    }
  }, [addMessage, addMessageToChannel]);

  // Message sent confirmation handler
  const handleMessageSent = useCallback((data: any) => {
    console.log('Message sent confirmation:', data);
  }, []);

  // Typing indicator handler
  const handleTyping = useCallback((data: {
    userId: string;
    username: string;
    serverId: string;
    channelId: string;
    isTyping: boolean;
  }) => {
    const { userId, isTyping: typing } = data;
    
    setIsTyping(prev => ({
      ...prev,
      [userId]: typing
    }));

    // Clear typing indicator after 3 seconds
    if (typing) {
      setTypingTimeouts(prev => {
        // Clear existing timeout for this user
        if (prev[userId]) {
          clearTimeout(prev[userId]);
        }
        
        const newTimeout = setTimeout(() => {
          setIsTyping(current => ({
            ...current,
            [userId]: false
          }));
          
          setTypingTimeouts(timeouts => {
            const { [userId]: removed, ...rest } = timeouts;
            return rest;
          });
        }, 3000);

        return {
          ...prev,
          [userId]: newTimeout
        };
      });
    } else {
      // Clear timeout if user stopped typing
      setTypingTimeouts(prev => {
        if (prev[userId]) {
          clearTimeout(prev[userId]);
          const { [userId]: removed, ...rest } = prev;
          return rest;
        }
        return prev;
      });
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    console.log('🎯 Setting up chat event listeners');
    websocketService.on('chat:message:received', handleMessageReceived);
    websocketService.on('chat:message:sent', handleMessageSent);
    websocketService.on('chat:typing', handleTyping);

    // 디버깅: WebSocket 연결 상태 확인
    console.log('WebSocket connected:', websocketService.isConnected());

    return () => {
      console.log('🔥 Cleaning up chat event listeners');
      websocketService.off('chat:message:received', handleMessageReceived);
      websocketService.off('chat:message:sent', handleMessageSent);
      websocketService.off('chat:typing', handleTyping);
      
      // Clear all typing timeouts
      Object.values(typingTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [handleMessageReceived, handleMessageSent, handleTyping, typingTimeouts]);

  // Send message
  const sendMessage = useCallback((
    serverId: string,
    channelId: string,
    content: string,
    messageType: 'text' | 'gif' | 'emoji' = 'text'
  ) => {
    try {
      console.log('📤 Sending message:', { serverId, channelId, content, messageType });
      websocketService.sendMessage(serverId, channelId, content, messageType);
      console.log('✅ Message sent to WebSocket');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((serverId: string, channelId: string, isTypingValue: boolean) => {
    websocketService.sendTyping(serverId, channelId, isTypingValue);
  }, []);

  // Event callback setters
  const onMessageReceived = useCallback((callback: (message: ChatMessage) => void) => {
    websocketService.on('chat:message:received', callback);
    return () => websocketService.off('chat:message:received', callback);
  }, []);

  const onMessageSent = useCallback((callback: (data: any) => void) => {
    websocketService.on('chat:message:sent', callback);
    return () => websocketService.off('chat:message:sent', callback);
  }, []);

  const onTyping = useCallback((callback: (data: any) => void) => {
    websocketService.on('chat:typing', callback);
    return () => websocketService.off('chat:typing', callback);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    sendTyping,
    onMessageReceived,
    onMessageSent,
    onTyping
  };
};