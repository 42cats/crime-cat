import { User } from "@/lib/types";
import { apiClient } from "@/lib/api";

export const authService = {
  getCurrentUser: async (): Promise<User | null> => {
    try {
      return await apiClient.get<User>('/auth/me');
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
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
  
  login: async (code: string, role: string): Promise<User | null> => {
    try {
      let user: User;

      return user;
    } catch (error) {
      console.error('Error in login:', error);
      return null;
    }
  },
  
  logout: async (): Promise<void> => {
    try {
      await apiClient.post<void>('/auth/logout', {});
    } catch (error) {
      console.error('Error in logout:', error);
      return null;
    }
  },
  
  getUserGuilds: async (): Promise<any[]> => {
    try {
      return await apiClient.get<any[]>('/auth/guilds');
    } catch (error) {
      console.error('Error in getUserGuilds:', error);
      
      return [];
    }
  }
};
