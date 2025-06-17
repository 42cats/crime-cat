import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'gif' | 'emoji';
}

export interface VoiceUser {
  id: string;
  username: string;
  avatar?: string;
  volume: number;
  isMuted: boolean;
  isConnected: boolean;
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
  // Chat State
  messages: ChatMessage[];
  isConnected: boolean;
  
  // Voice State
  voiceUsers: VoiceUser[];
  isVoiceConnected: boolean;
  localMuted: boolean;
  voiceEffect: 'none' | 'robot' | 'echo' | 'pitch';
  
  // Admin State
  votes: Vote[];
  announcements: Announcement[];
  audioFiles: AudioFile[];
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setConnected: (connected: boolean) => void;
  
  setVoiceUsers: (users: VoiceUser[]) => void;
  updateUserVolume: (userId: string, volume: number) => void;
  setVoiceConnected: (connected: boolean) => void;
  setLocalMuted: (muted: boolean) => void;
  setVoiceEffect: (effect: 'none' | 'robot' | 'echo' | 'pitch') => void;
  
  addVote: (vote: Vote) => void;
  addVoteResponse: (response: VoteResponse) => void;
  addAnnouncement: (announcement: Announcement) => void;
  addAudioFile: (file: AudioFile) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  messages: [],
  isConnected: false,
  voiceUsers: [],
  isVoiceConnected: false,
  localMuted: false,
  voiceEffect: 'none',
  votes: [],
  announcements: [],
  audioFiles: [],
  
  // Chat Actions
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message] 
    })),
    
  setMessages: (messages) => 
    set({ messages }),
    
  setConnected: (connected) => 
    set({ isConnected: connected }),
  
  // Voice Actions
  setVoiceUsers: (users) => 
    set({ voiceUsers: users }),
    
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