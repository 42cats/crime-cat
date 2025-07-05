import { create } from 'zustand';
import { VoiceUser } from '../services/websocketService';

export interface ChatMessage {
  id: string;
  serverId?: number;
  channelId?: number;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'gif' | 'emoji';
  serverProfile?: {
    roles: ServerRole[];
    displayName: string;
  };
  buffered?: boolean;
}

export interface ServerRole {
  id: number;
  name: string;
  color: string;
  permissions: string[];
}

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
  id: string;
  serverId: string;
  name: string;
  description?: string;
  type: 'TEXT' | 'VOICE';  // Phase 1에서 BOTH 제거
  memberCount: number;
  maxMembers: number;
}

export interface Vote {
  id: string;
  question: string;
  options: string[];
  createdBy: string;
  createdAt: Date;
  responses: VoteResponse[];
}

export interface VoteResponse {
  voteId: string;
  userId: string;
  choice: number;
  createdAt: Date;
}

export interface Announcement {
  id: string;
  message: string;
  createdBy: string;
  createdAt: Date;
}

export interface AudioFile {
  id: string;
  filename: string;
  duration: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface CurrentUser {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
}

interface AppState {
  // Connection State
  isConnected: boolean;
  
  // User State
  currentUser?: CurrentUser;
  
  // Server-Channel State
  currentServer?: string;
  currentChannel?: { serverId: string; channelId: string };
  servers: ServerInfo[];
  channels: { [serverId: string]: ChannelInfo[] };
  serverRoles: ServerRole[];
  
  // Chat State
  messages: ChatMessage[];
  messagesByChannel: { [channelKey: string]: ChatMessage[] }; // key: serverId:channelId
  
  // Voice State
  voiceUsers: VoiceUser[];
  isVoiceConnected: boolean;
  localMuted: boolean;
  voiceEffect: 'none' | 'robot' | 'echo' | 'pitch';
  currentVoiceChannel?: { serverId: string; channelId: string };
  
  // Admin State
  votes: Vote[];
  announcements: Announcement[];
  audioFiles: AudioFile[];
  
  // Connection Actions
  setConnected: (connected: boolean) => void;
  
  // User Actions
  setCurrentUser: (user?: CurrentUser) => void;
  
  // Server-Channel Actions
  setCurrentServer: (serverId?: string) => void;
  setCurrentChannel: (channel?: { serverId: string; channelId: string }) => void;
  setServers: (servers: ServerInfo[]) => void;
  addServer: (server: ServerInfo) => void;
  setChannels: (serverId: string, channels: ChannelInfo[]) => void;
  addChannel: (serverId: string, channel: ChannelInfo) => void;
  setServerRoles: (roles: ServerRole[]) => void;
  
  // Chat Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessageToChannel: (serverId: string, channelId: string, message: ChatMessage) => void;
  setChannelMessages: (serverId: string, channelId: string, messages: ChatMessage[]) => void;
  getChannelMessages: (serverId: string, channelId: string) => ChatMessage[];
  
  // Voice Actions
  setVoiceUsers: (users: VoiceUser[]) => void;
  addVoiceUser: (user: VoiceUser) => void;
  removeVoiceUser: (userId: string) => void;
  updateUserVolume: (userId: string, volume: number) => void;
  setVoiceConnected: (connected: boolean) => void;
  setLocalMuted: (muted: boolean) => void;
  setVoiceEffect: (effect: 'none' | 'robot' | 'echo' | 'pitch') => void;
  setCurrentVoiceChannel: (channel?: { serverId: string; channelId: string }) => void;
  
  // Admin Actions
  addVote: (vote: Vote) => void;
  addVoteResponse: (response: VoteResponse) => void;
  addAnnouncement: (announcement: Announcement) => void;
  addAudioFile: (file: AudioFile) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  isConnected: false,
  currentUser: undefined,
  currentServer: undefined,
  currentChannel: undefined,
  servers: [],
  channels: {},
  serverRoles: [],
  messages: [],
  messagesByChannel: {},
  voiceUsers: [],
  isVoiceConnected: false,
  localMuted: false,
  voiceEffect: 'none',
  currentVoiceChannel: undefined,
  votes: [],
  announcements: [],
  audioFiles: [],
  
  // Connection Actions
  setConnected: (connected) => 
    set({ isConnected: connected }),
  
  // User Actions
  setCurrentUser: (user) => 
    set({ currentUser: user }),
  
  // Server-Channel Actions
  setCurrentServer: (serverId) => 
    set({ currentServer: serverId }),
    
  setCurrentChannel: (channel) => 
    set({ currentChannel: channel }),
    
  setServers: (servers) => 
    set({ servers }),
    
  addServer: (server) => 
    set((state) => ({ 
      servers: [...state.servers, server] 
    })),
    
  setChannels: (serverId, channels) => 
    set((state) => ({ 
      channels: { ...state.channels, [serverId]: channels } 
    })),
    
  addChannel: (serverId, channel) => 
    set((state) => ({
      channels: {
        ...state.channels,
        [serverId]: [...(state.channels[serverId] || []), channel]
      }
    })),
    
  setServerRoles: (roles) => 
    set({ serverRoles: roles }),
  
  // Chat Actions
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message] 
    })),
    
  setMessages: (messages) => 
    set({ messages }),
    
  addMessageToChannel: (serverId, channelId, message) => 
    set((state) => {
      const channelKey = `${serverId}:${channelId}`;
      const existingMessages = state.messagesByChannel[channelKey] || [];
      
      // 중복 메시지 검사 (ID 기반)
      const messageExists = existingMessages.some(existingMessage => existingMessage.id === message.id);
      
      if (messageExists) {
        console.log('🚫 Duplicate message detected, skipping:', message.id);
        return state; // 상태 변경 없이 기존 상태 반환
      }
      
      console.log('✅ Adding new message to channel:', message.id);
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelKey]: [...existingMessages, message]
        }
      };
    }),
    
  setChannelMessages: (serverId, channelId, messages) => 
    set((state) => {
      const channelKey = `${serverId}:${channelId}`;
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelKey]: messages
        }
      };
    }),
    
  getChannelMessages: (serverId, channelId) => {
    const state = get();
    const channelKey = `${serverId}:${channelId}`;
    return state.messagesByChannel[channelKey] || [];
  },
  
  // Phase 1-3: Signal Server 우선 음성 사용자 관리
  setVoiceUsers: (users) => {
    console.log('🎯 [Phase 1-3] Signal Server 사용자 목록 설정:', users.length, '명');
    // Signal Server가 단일 진실 소스이므로 무조건 덮어쓰기
    set({ voiceUsers: Array.isArray(users) ? users : [] });
  },
    
  addVoiceUser: (user) => 
    set((state) => {
      console.log('➕ [Phase 1-3] Signal Server 사용자 추가:', user.username);
      const voiceUsers = Array.isArray(state.voiceUsers) ? state.voiceUsers : [];
      
      // Signal Server에서 오는 데이터를 무조건 신뢰하되 중복 방지
      const normalizedUser: VoiceUser = {
        id: user.id || user.userId || '',
        username: user.username || 'Unknown',
        serverId: user.serverId || '',
        channelId: user.channelId || '',
        volume: user.volume ?? 50,
        isMuted: user.isMuted ?? false,
        isConnected: user.isConnected ?? true,
        ...user // Signal Server 데이터 우선
      };
      
      // Phase 1-3: 중복 확인 후 추가 (React 키 오류 방지)
      const exists = voiceUsers.some(u => 
        u.id === normalizedUser.id || 
        (normalizedUser.userId && (u.id === normalizedUser.userId || u.userId === normalizedUser.userId))
      );
      
      if (exists) {
        console.log('⚠️ [Phase 1-3] 중복 사용자 감지, 추가 생략:', normalizedUser.username);
        return state;
      }
      
      return { voiceUsers: [...voiceUsers, normalizedUser] };
    }),
    
  removeVoiceUser: (userId) => 
    set((state) => {
      console.log('➖ [Phase 1-3] Signal Server 사용자 제거:', userId);
      const voiceUsers = Array.isArray(state.voiceUsers) ? state.voiceUsers : [];
      // Signal Server에서 오는 제거 명령을 무조건 신뢰
      return { 
        voiceUsers: voiceUsers.filter(u => u.id !== userId && u.userId !== userId) 
      };
    }),
    
  updateUserVolume: (userId, volume) =>
    set((state) => {
      const voiceUsers = Array.isArray(state.voiceUsers) ? state.voiceUsers : [];
      return {
        voiceUsers: voiceUsers.map(user =>
          (user.id === userId || user.userId === userId) ? { ...user, volume } : user
        )
      };
    }),
    
  setVoiceConnected: (connected) => 
    set({ isVoiceConnected: connected }),
    
  setLocalMuted: (muted) => 
    set({ localMuted: muted }),
    
  setVoiceEffect: (effect) => 
    set({ voiceEffect: effect }),
    
  setCurrentVoiceChannel: (channel) => 
    set({ currentVoiceChannel: channel }),
  
  // Admin Actions
  addVote: (vote) =>
    set((state) => ({
      votes: [...state.votes, vote]
    })),
    
  addVoteResponse: (response) =>
    set((state) => ({
      votes: state.votes.map(vote =>
        vote.id === response.voteId
          ? { ...vote, responses: [...vote.responses, response] }
          : vote
      )
    })),
    
  addAnnouncement: (announcement) =>
    set((state) => ({
      announcements: [...state.announcements, announcement]
    })),
    
  addAudioFile: (file) =>
    set((state) => ({
      audioFiles: [...state.audioFiles, file]
    })),
}));

// 디버깅을 위한 전역 스토어 노출
if (typeof window !== 'undefined') {
  (window as any).useAppStore = useAppStore;
  console.log('🌐 Zustand 스토어가 전역으로 노출되었습니다: window.useAppStore');
}