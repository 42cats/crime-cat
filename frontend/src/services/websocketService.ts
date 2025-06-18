console.log('📥 Importing socket.io-client...');
import { io, Socket } from 'socket.io-client';
console.log('✅ socket.io-client imported successfully', { io, Socket });

export interface ServerInfo {
  id: string;
  name: string;
  description?: string;
  hasPassword: boolean;
  memberCount: number;
  maxMembers: number;
  roles?: ServerRole[];
}

export interface ChannelInfo {
  id: string;
  serverId: string;
  name: string;
  description?: string;
  type: 'TEXT' | 'VOICE' | 'BOTH';
  memberCount: number;
  maxMembers: number;
}

export interface ServerRole {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

export interface ChatMessage {
  id: string;
  serverId: string;
  channelId: string;
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
  serverId: string;
  channelId: string;
  volume?: number;
  isMuted?: boolean;
  isDeafened?: boolean;
  isScreenSharing?: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  currentServer?: string;
  currentChannel?: { serverId: string; channelId: string };
  currentVoiceChannel?: { serverId: string; channelId: string };
  serverRoles: ServerRole[];
}

class WebSocketService {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    serverRoles: []
  };
  
  // Event listeners
  private eventListeners: { [event: string]: ((...args: unknown[]) => void)[] } = {};

  constructor() {
    console.log('🏗️ WebSocketService constructor called');
    this.initializeConnection();
  }

  private initializeConnection() {
    const token = this.getAuthToken();
    const signalServerUrl = import.meta.env.VITE_SIGNAL_SERVER_URL || 'http://localhost:4000';
    
    console.log('🔌 Initializing WebSocket connection...');
    console.log('Signal Server URL:', signalServerUrl);
    console.log('Auth token available:', !!token);
    console.log('Environment variables:', {
      VITE_SIGNAL_SERVER_URL: import.meta.env.VITE_SIGNAL_SERVER_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    });
    
    if (!token) {
      console.warn('⚠️ No auth token found, attempting connection without authentication');
      // 토큰이 없어도 연결 시도 (Signal Server에서 처리)
    }

    this.socket = io(signalServerUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
    });
    
    // 연결 시도 즉시 로깅
    console.log('📡 Socket.IO instance created');
    console.log('Socket connected:', this.socket.connected);
    console.log('Socket disconnected:', this.socket.disconnected);

    this.setupEventHandlers();
  }

  private getAuthToken(): string | null {
    console.log('🔑 Searching for auth token...');
    console.log('🍪 All cookies:', document.cookie);
    
    // 쿠키에서 토큰 추출 (여러 가능한 토큰 이름 시도)
    const cookies = document.cookie.split(';');
    const possibleTokenNames = ['Authorization', 'RefreshToken', 'accessToken', 'access_token', 'jwt', 'token', 'authToken'];
    
    console.log('🍪 Parsed cookies:', cookies.map(c => c.trim().split('=')));
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      console.log(`🔍 Checking cookie: ${name} = ${value ? '[PRESENT]' : '[EMPTY]'}`);
      if (possibleTokenNames.includes(name)) {
        console.log('✅ Found auth token in cookies:', name, value ? 'present' : 'empty');
        return value;
      }
    }
    
    // localStorage에서도 확인
    console.log('🗃️ Checking localStorage...');
    for (const tokenName of possibleTokenNames) {
      const token = localStorage.getItem(tokenName);
      if (token) {
        console.log('✅ Found auth token in localStorage:', tokenName);
        return token;
      }
    }
    
    console.warn('⚠️ No auth token found in cookies or localStorage');
    console.log('🔍 Available localStorage keys:', Object.keys(localStorage));
    return null;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // 연결 상태 관리
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected to Signal Server');
      console.log('Socket ID:', this.socket?.id);
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
      console.error('Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
      this.emit('connection:error', error);
    });

    // 추가 디버깅 이벤트들
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 WebSocket reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ WebSocket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed');
    });

    // 서버 연결 실패 이벤트 추가
    this.socket.on('server:join:error', (error) => {
      console.error('❌ Server join error:', error);
      this.emit('server:join:error', error);
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
  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: unknown) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  // 서버 관련 메서드
  joinServer(serverId: string) {
    if (!this.socket) {
      throw new Error('WebSocket not initialized');
    }
    
    if (!this.socket.connected) {
      throw new Error('WebSocket not connected to Signal Server');
    }
    
    console.log('🚀 Attempting to join server:', serverId);
    console.log('Socket connected:', this.socket.connected);
    console.log('Socket ID:', this.socket.id);
    
    this.socket.emit('server:join', { serverId });
    console.log('📤 Server join request sent');
  }

  leaveServer(serverId: string) {
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
  joinChannel(serverId: string, channelId: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    console.log('🚀 Joining channel:', serverId, channelId);
    this.socket.emit('channel:join', { serverId, channelId });
  }

  leaveChannel(serverId: string, channelId: string) {
    if (!this.socket?.connected) return;
    
    console.log('👋 Leaving channel:', serverId, channelId);
    this.socket.emit('channel:leave', { serverId, channelId });
    
    if (this.connectionState.currentChannel?.serverId === serverId && 
        this.connectionState.currentChannel?.channelId === channelId) {
      this.connectionState.currentChannel = undefined;
    }
  }

  // 채팅 관련 메서드
  sendMessage(serverId: string, channelId: string, content: string, messageType: 'text' | 'gif' | 'emoji' = 'text') {
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

  sendTyping(serverId: string, channelId: string, isTyping: boolean) {
    if (!this.socket?.connected) return;

    this.socket.emit('chat:typing', {
      serverId,
      channelId,
      isTyping
    });
  }

  // 음성 채팅 관련 메서드
  joinVoiceChannel(serverId: string, channelId: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    console.log('🎤 Joining voice channel:', serverId, channelId);
    this.socket.emit('voice:join', { serverId, channelId });
  }

  leaveVoiceChannel(serverId?: string, channelId?: string) {
    if (!this.socket?.connected) return;

    console.log('🔇 Leaving voice channel');
    this.socket.emit('voice:leave', { serverId, channelId });
    
    this.connectionState.currentVoiceChannel = undefined;
  }

  updateVoiceStatus(serverId: string, channelId: string, status: {
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
  sendOffer(targetUserId: string, offer: RTCSessionDescriptionInit, serverId: string, channelId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('voice:offer', {
      targetUserId,
      offer,
      serverId,
      channelId
    });
  }

  sendAnswer(targetUserId: string, answer: RTCSessionDescriptionInit, serverId: string, channelId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('voice:answer', {
      targetUserId,
      answer,
      serverId,
      channelId
    });
  }

  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit, serverId: string, channelId: string) {
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
console.log('📦 Creating WebSocketService singleton instance...');
export const websocketService = new WebSocketService();

// 개발 모드에서 전역으로 노출 (디버깅용)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).websocketService = websocketService;
  
  // 테스트 도우미 함수들
  (window as any).testChat = {
    join: (serverId = 'test-server', channelId = 'test-channel') => {
      console.log('🧪 Test: Joining server and channel...');
      websocketService.joinServer(serverId);
      websocketService.joinChannel(serverId, channelId);
    },
    send: (message = 'Hello from console!', serverId = 'test-server', channelId = 'test-channel') => {
      console.log('🧪 Test: Sending message...');
      websocketService.sendMessage(serverId, channelId, message);
    },
    status: () => {
      console.log('🧪 Test: WebSocket status:', {
        connected: websocketService.isConnected(),
        state: websocketService.getConnectionState()
      });
    }
  };
  
  console.log('🌐 WebSocketService is available globally as window.websocketService');
  console.log('🧪 Test helpers available as window.testChat');
  console.log('Usage:');
  console.log('  testChat.status() - Check connection status');
  console.log('  testChat.join() - Join test server and channel');
  console.log('  testChat.send("Hello") - Send test message');
}

export default websocketService;