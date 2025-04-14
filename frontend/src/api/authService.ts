
import { User } from '@/lib/types';
import { apiClient } from '@/lib/api';

// Default user data for fallback
const defaultUser: User = {
  id: '1',
  discordId: '123456789012345678',
  displayName: 'Demo User',
  avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
  role: 'visitor'
};

// Mock users for demonstration
const mockUsers = {
  admin: {
    id: '1',
    discordId: '123456789012345678',
    displayName: 'Admin User',
    avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
    role: 'admin' as const
  },
  super: {
    id: '2',
    discordId: '234567890123456789',
    displayName: 'Super User',
    avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
    role: 'super' as const
  },
  regular: {
    id: '3', 
    discordId: '345678901234567890',
    displayName: 'Regular User',
    avatar: 'https://cdn.discordapp.com/embed/avatars/3.png',
    role: 'regular' as const
  },
  visitor: {
    id: '4',
    discordId: '456789012345678901',
    displayName: 'Visitor',
    avatar: 'https://cdn.discordapp.com/embed/avatars/4.png',
    role: 'visitor' as const
  }
};

export const authService = {
  getCurrentUser: async (): Promise<User | null> => {
    try {
      // Check if user is stored in localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      // If not in localStorage, try to get from API
      return await apiClient.get<User>('/auth/me');
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      
      // For demo purposes, check if we have a mock user in localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      return null;
    }
  },
  
  getUserProfile: async (userId: string): Promise<User | null> => {
    try {
      return await apiClient.get<User>(`/users/${userId}`);
    } catch (error) {
      console.error(`Error in getUserProfile:`, error);
      return null;
    }
  },
  
  login: async (code: string, role: string = 'visitor'): Promise<User | null> => {
    try {
      // In a real app, this would call the API
      // For demo purposes, we'll use mock data
      let user: User;
      
      if (role === 'admin') {
        user = mockUsers.admin;
      } else if (role === 'super') {
        user = mockUsers.super;
      } else if (role === 'regular') {
        user = mockUsers.regular;
      } else {
        user = mockUsers.visitor;
      }
      
      // Store user in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Error in login:', error);
      return null;
    }
  },
  
  logout: async (): Promise<void> => {
    try {
      // Remove user from localStorage
      localStorage.removeItem('currentUser');
      
      // In a real app, this would also call the API
      await apiClient.post<void>('/auth/logout', {});
    } catch (error) {
      console.error('Error in logout:', error);
      // Still remove from localStorage even if API call fails
      localStorage.removeItem('currentUser');
    }
  },
  
  getUserGuilds: async (): Promise<any[]> => {
    try {
      return await apiClient.get<any[]>('/auth/guilds');
    } catch (error) {
      console.error('Error in getUserGuilds:', error);
      
      // Return mock guilds for demo
      return [
        {
          id: '123456789012345678',
          name: 'Demo Server 1',
          icon: 'https://cdn.discordapp.com/icons/123456789012345678/abcdef.png',
          owner: false,
          permissions: 0,
          features: []
        },
        {
          id: '234567890123456789',
          name: 'Demo Server 2',
          icon: 'https://cdn.discordapp.com/icons/234567890123456789/bcdefg.png',
          owner: true,
          permissions: 8,
          features: ['COMMUNITY']
        }
      ];
    }
  }
};
