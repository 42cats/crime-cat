import { io, Socket } from 'socket.io-client';

export interface ServerInfo {
  id: number;
  name: string;
  description?: string;
  hasPassword: boolean;
  memberCount: number;
  maxMembers: number;
  roles?: ServerRole[];
}

export interface ChannelInfo {
  id: number;
  serverId: number;
  name: string;
  description?: string;
  type: 'TEXT' | 'VOICE' | 'BOTH';
  memberCount: number;
  maxMembers: number;
}

export interface ServerRole {
  id: number;
  name: string;
  color: string;
  permissions: string[];
}

export interface ChatMessage {
  id: string;
  serverId: number;
  channelId: number;
  userId: string;
  username: string;
  content: string;
  messageType: 'text' | 'gif' | 'emoji';
  timestamp: Date;
  serverProfile?: {
    roles: ServerRole[];
    displayName: string;
  };
  buffered?: boolean;
}

export interface VoiceUser {
  userId: string;
  username: string;
  serverId: number;
  channelId: number;
  volume?: number;
  isMuted?: boolean;
  isDeafened?: boolean;
  isScreenSharing?: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  currentServer?: number;
  currentChannel?: { serverId: number; channelId: number };
  currentVoiceChannel?: { serverId: number; channelId: number };
  serverRoles: ServerRole[];
}

class WebSocketService {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    serverRoles: []
  };
  
  // Event listeners
  private eventListeners: { [event: string]: Function[] } = {};

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    const token = this.getAuthToken();
    if (!token) {
      console.warn('No auth token found, WebSocket connection not established');
      return;
    }

    this.socket = io(process.env.REACT_APP_SIGNAL_SERVER_URL || 'http://localhost:3001', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  private getAuthToken(): string | null {
    // 쿠키에서 토큰 추출
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'accessToken') {
        return value;
      }
    }
    return null;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // 연결 상태 관리
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.connectionState.isConnected = true;
      this.emit('connection:status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.connectionState = {
        isConnected: false,
        serverRoles: []
      };
      this.emit('connection:status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.emit('connection:error', error);
    });

    // 서버 관련 이벤트
    this.socket.on('server:join:success', (data) => {
      console.log('✅ Joined server:', data);
      this.connectionState.currentServer = data.serverId;
      this.connectionState.serverRoles = data.roles || [];
      this.emit('server:joined', data);
    });

    this.socket.on('server:user-joined', (data) => {
      this.emit('server:member:joined', data);
    });

    this.socket.on('server:user-left', (data) => {
      this.emit('server:member:left', data);
    });

    // 채널 관련 이벤트
    this.socket.on('channel:join:success', (data) => {
      console.log('✅ Joined channel:', data);
      this.connectionState.currentChannel = {
        serverId: data.serverId,
        channelId: data.channelId
      };
      this.emit('channel:joined', data);
    });

    this.socket.on('channel:user-joined', (data) => {
      this.emit('channel:member:joined', data);
    });

    this.socket.on('channel:user-left', (data) => {
      this.emit('channel:member:left', data);
    });

    // 채팅 관련 이벤트
    this.socket.on('chat:message', (message: ChatMessage) => {
      this.emit('chat:message:received', message);
    });

    this.socket.on('chat:message:ack', (data) => {
      this.emit('chat:message:sent', data);
    });

    this.socket.on('chat:typing', (data) => {
      this.emit('chat:typing', data);
    });

    // 음성 채팅 관련 이벤트
    this.socket.on('voice:join:success', (data) => {
      console.log('✅ Joined voice channel:', data);
      this.connectionState.currentVoiceChannel = {
        serverId: data.serverId,
        channelId: data.channelId
      };
      this.emit('voice:joined', data);
    });

    this.socket.on('voice:user-joined', (data: VoiceUser) => {
      this.emit('voice:member:joined', data);
    });

    this.socket.on('voice:user-left', (data: VoiceUser) => {
      this.emit('voice:member:left', data);
    });

    this.socket.on('voice:volume', (data) => {
      this.emit('voice:volume:updated', data);
    });

    this.socket.on('voice:status', (data) => {
      this.emit('voice:status:updated', data);
    });

    // WebRTC 시그널링
    this.socket.on('voice:offer', (data) => {
      this.emit('webrtc:offer', data);
    });

    this.socket.on('voice:answer', (data) => {
      this.emit('webrtc:answer', data);
    });

    this.socket.on('voice:ice-candidate', (data) => {
      this.emit('webrtc:ice-candidate', data);
    });

    // 에러 처리
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      this.emit('error', error);
    });
  }

  // 이벤트 리스너 관리
  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  // 서버 관련 메서드
  joinServer(serverId: number) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    console.log('🚀 Joining server:', serverId);
    this.socket.emit('server:join', { serverId });
  }

  leaveServer(serverId: number) {
    if (!this.socket?.connected) return;
    
    console.log('👋 Leaving server:', serverId);
    this.socket.emit('server:leave', { serverId });
    
    if (this.connectionState.currentServer === serverId) {
      this.connectionState.currentServer = undefined;
      this.connectionState.currentChannel = undefined;
      this.connectionState.currentVoiceChannel = undefined;
      this.connectionState.serverRoles = [];
    }
  }

  // 채널 관련 메서드
  joinChannel(serverId: number, channelId: number) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    console.log('🚀 Joining channel:', serverId, channelId);
    this.socket.emit('channel:join', { serverId, channelId });
  }

  leaveChannel(serverId: number, channelId: number) {
    if (!this.socket?.connected) return;
    
    console.log('👋 Leaving channel:', serverId, channelId);
    this.socket.emit('channel:leave', { serverId, channelId });
    
    if (this.connectionState.currentChannel?.serverId === serverId && 
        this.connectionState.currentChannel?.channelId === channelId) {
      this.connectionState.currentChannel = undefined;
    }
  }

  // 채팅 관련 메서드
  sendMessage(serverId: number, channelId: number, content: string, messageType: 'text' | 'gif' | 'emoji' = 'text') {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    if (!this.connectionState.currentChannel || 
        this.connectionState.currentChannel.serverId !== serverId ||
        this.connectionState.currentChannel.channelId !== channelId) {
      throw new Error('Not in the specified channel');
    }

    this.socket.emit('chat:message', {
      serverId,
      channelId,
      content,
      messageType
    });
  }

  sendTyping(serverId: number, channelId: number, isTyping: boolean) {
    if (!this.socket?.connected) return;

    this.socket.emit('chat:typing', {
      serverId,
      channelId,
      isTyping
    });
  }

  // 음성 채팅 관련 메서드
  joinVoiceChannel(serverId: number, channelId: number) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    console.log('🎤 Joining voice channel:', serverId, channelId);
    this.socket.emit('voice:join', { serverId, channelId });
  }

  leaveVoiceChannel(serverId?: number, channelId?: number) {
    if (!this.socket?.connected) return;

    console.log('🔇 Leaving voice channel');
    this.socket.emit('voice:leave', { serverId, channelId });
    
    this.connectionState.currentVoiceChannel = undefined;
  }

  updateVoiceStatus(serverId: number, channelId: number, status: {
    isMuted?: boolean;
    isDeafened?: boolean;
    isScreenSharing?: boolean;
  }) {
    if (!this.socket?.connected) return;

    this.socket.emit('voice:status', {
      serverId,
      channelId,
      status
    });
  }

  // WebRTC 시그널링 메서드
  sendOffer(targetUserId: string, offer: RTCSessionDescriptionInit, serverId: number, channelId: number) {
    if (!this.socket?.connected) return;

    this.socket.emit('voice:offer', {
      targetUserId,
      offer,
      serverId,
      channelId
    });
  }

  sendAnswer(targetUserId: string, answer: RTCSessionDescriptionInit, serverId: number, channelId: number) {
    if (!this.socket?.connected) return;

    this.socket.emit('voice:answer', {
      targetUserId,
      answer,
      serverId,
      channelId
    });
  }

  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit, serverId: number, channelId: number) {
    if (!this.socket?.connected) return;

    this.socket.emit('voice:ice-candidate', {
      targetUserId,
      candidate,
      serverId,
      channelId
    });
  }

  // 연결 상태 조회
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 연결 해제
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState = {
      isConnected: false,
      serverRoles: []
    };
  }

  // 재연결
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.initializeConnection();
    }
  }
}

// 싱글톤 인스턴스
export const websocketService = new WebSocketService();
export default websocketService;