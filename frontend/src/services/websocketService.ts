import { io, Socket } from 'socket.io-client';

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
  type: 'TEXT' | 'VOICE';  // Phase 1에서 BOTH 제거
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
  id: string;  // 메인 ID (useAppStore와 통일)
  userId?: string;  // 하위 호환성을 위해 선택적 유지
  username: string;
  serverId: string;  // UUID 문자열
  channelId: string;  // UUID 문자열
  trackId?: string;  // SFU 트랙 ID (Cloudflare Realtime)
  sessionId?: string;  // SFU 세션 ID (원격 트랙 구독용)
  avatar?: string;  // useAppStore와 통일
  volume: number;  // useAppStore와 통일 (필수, 기본값 50)
  isMuted: boolean;  // useAppStore와 통일 (필수, 기본값 false)
  isConnected: boolean;  // useAppStore와 통일 (필수, 기본값 true)
  isDeafened?: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;  // Phase 1에서 추가된 Speaking Detection
  joinedAt?: Date;
  lastActivity?: Date;
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

  private async initializeConnection() {
    const token = await this.getAuthToken();
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

  private async getAuthToken(): Promise<string | null> {
    console.log('🔑 Fetching auth token from backend...');
    
    try {
      // 백엔드 API를 통해 토큰 획득
      const response = await fetch('/api/v1/auth/websocket-token', {
        method: 'GET',
        credentials: 'include', // 쿠키 포함
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully retrieved token from backend');
        return data.token;
      } else {
        console.warn('⚠️ Failed to get token from backend:', response.status, response.statusText);
        
        // 백엔드 실패 시 기존 방식으로 폴백
        return this.getAuthTokenFallback();
      }
    } catch (error) {
      console.error('❌ Error fetching token from backend:', error);
      
      // 에러 발생 시 기존 방식으로 폴백
      return this.getAuthTokenFallback();
    }
  }

  private getAuthTokenFallback(): string | null {
    console.log('🔄 Falling back to client-side token search...');
    
    // localStorage에서 확인
    const possibleTokenNames = ['Authorization', 'RefreshToken', 'accessToken', 'access_token', 'jwt', 'token', 'authToken'];
    
    for (const tokenName of possibleTokenNames) {
      const token = localStorage.getItem(tokenName);
      if (token) {
        console.log('✅ Found auth token in localStorage:', tokenName);
        return token;
      }
    }
    
    console.warn('⚠️ No auth token found');
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
      
      // voice:join:success 이벤트를 그대로 전달
      this.emit('voice:join:success', data);
    });

    this.socket.on('voice:user-joined', (data: VoiceUser) => {
      console.log('🔔 Voice user joined:', data);
      this.emit('voice:user-joined', data);
    });

    this.socket.on('voice:user-left', (data: VoiceUser) => {
      console.log('👋 Voice user left:', data);
      this.emit('voice:user-left', data);
    });

    this.socket.on('voice:volume', (data) => {
      this.emit('voice:volume:updated', data);
    });

    this.socket.on('voice:status', (data) => {
      this.emit('voice:status:updated', data);
    });

    // Phase 2/3: 새로운 Discord 스타일 음성 이벤트들
    this.socket.on('voice:speaking', (data) => {
      this.emit('voice:speaking:updated', data);
    });

    this.socket.on('voice:state:update', (data) => {
      this.emit('voice:state:updated', data);
    });

    this.socket.on('voice:users', (data) => {
      this.emit('voice:users:received', data);
    });


    // SFU 트랙 관리 이벤트 (P2P WebRTC 시그널링 대체)
    this.socket.on('sfu:track:published', (data) => {
      this.emit('sfu:track:published', data);
    });

    this.socket.on('sfu:track:unpublished', (data) => {
      this.emit('sfu:track:unpublished', data);
    });

    this.socket.on('sfu:track:publish:success', (data) => {
      this.emit('sfu:track:publish:success', data);
    });

    this.socket.on('sfu:track:publish:error', (data) => {
      this.emit('sfu:track:publish:error', data);
    });

    this.socket.on('sfu:track:subscribe:success', (data) => {
      this.emit('sfu:track:subscribe:success', data);
    });

    this.socket.on('sfu:track:subscribe:error', (data) => {
      this.emit('sfu:track:subscribe:error', data);
    });

    this.socket.on('sfu:track:unpublish:success', (data) => {
      this.emit('sfu:track:unpublish:success', data);
    });

    this.socket.on('sfu:track:unpublish:error', (data) => {
      this.emit('sfu:track:unpublish:error', data);
    });

    // 사용자 온라인 상태 관련 이벤트
    this.socket.on('user:online', (data) => {
      console.log('✅ User came online:', data);
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data) => {
      console.log('❌ User went offline:', data);
      this.emit('user:offline', data);
    });

    this.socket.on('users:online:list', (data) => {
      console.log('📋 Online users list:', data);
      this.emit('users:online:list', data);
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
  joinVoiceChannel(serverId: string, channelId: string, trackId?: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    console.log('🎤 Joining voice channel:', serverId, channelId, trackId ? `(Track: ${trackId})` : '');
    this.socket.emit('voice:join', { serverId, channelId, trackId });
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
      ...status
    });
  }

  // Phase 3: 새로운 Discord 스타일 음성 이벤트 방출 메서드들
  
  // Speaking Detection 상태 전송
  updateSpeakingStatus(serverId: string, channelId: string, isSpeaking: boolean) {
    if (!this.socket?.connected) return;

    this.socket.emit('voice:speaking', {
      serverId,
      channelId,
      isSpeaking
    });
  }

  // 음성 채널 사용자 목록 요청
  requestVoiceUsers(serverId: string, channelId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('voice:get-users', {
      serverId,
      channelId
    });
  }

  // 서버 내 온라인 사용자 목록 요청
  requestOnlineUsers(serverId: string) {
    if (!this.socket?.connected) return;

    console.log('📡 온라인 사용자 목록 요청:', serverId);
    this.socket.emit('users:get-online', { serverId });
  }

  // SFU 트랙 관리 메서드 (P2P WebRTC 시그널링 대체)
  publishTrack(offer: RTCSessionDescriptionInit, serverId: string, channelId: string) {
    if (!this.socket?.connected) return;

    console.log('📤 SFU 트랙 발행 요청 전송:', serverId, channelId);
    this.socket.emit('sfu:track:publish', {
      offer,
      serverId,
      channelId
    });
  }

  subscribeToTrack(trackId: string, offer: RTCSessionDescriptionInit, serverId: string, channelId: string) {
    if (!this.socket?.connected) return;

    console.log('📤 SFU 트랙 구독 요청 전송:', trackId, serverId, channelId);
    this.socket.emit('sfu:track:subscribe', {
      trackId,
      offer,
      serverId,
      channelId
    });
  }

  unpublishTrack(serverId: string, channelId: string) {
    if (!this.socket?.connected) return;

    console.log('📤 SFU 트랙 발행 중단 요청 전송:', serverId, channelId);
    this.socket.emit('sfu:track:unpublish', {
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