import { create } from 'zustand';

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

export interface VoiceUser {
  id: string;
  username: string;
  serverId?: number;
  channelId?: number;
  avatar?: string;
  volume: number;
  isMuted: boolean;
  isConnected: boolean;
  isDeafened?: boolean;
  isScreenSharing?: boolean;
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
  type: 'TEXT' | 'VOICE' | 'BOTH';
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

interface AppState {
  // Connection State
  isConnected: boolean;
  
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
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelKey]: [...(state.messagesByChannel[channelKey] || []), message]
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
  
  // Voice Actions
  setVoiceUsers: (users) => 
    set({ voiceUsers: users }),
    
  addVoiceUser: (user) => 
    set((state) => ({ 
      voiceUsers: [...state.voiceUsers, user] 
    })),
    
  removeVoiceUser: (userId) => 
    set((state) => ({ 
      voiceUsers: state.voiceUsers.filter(u => u.id !== userId) 
    })),
    
  updateUserVolume: (userId, volume) =>
    set((state) => ({
      voiceUsers: state.voiceUsers.map(user =>
        user.id === userId ? { ...user, volume } : user
      )
    })),
    
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