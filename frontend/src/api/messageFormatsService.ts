
import { MessageFormat } from '@/lib/types';
import { apiClient } from '@/lib/api';

// Default message formats data for fallback
const defaultMessageFormats: MessageFormat[] = [
  {
    id: '1',
    guildId: '123456789',
    formatType: 'welcome',
    content: 'Welcome to the server, {user}! We hope you enjoy your stay.',
    isEnabled: true,
    createdBy: 'system',
    updatedBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    guildId: '123456789',
    formatType: 'goodbye',
    content: 'Goodbye, {user}! We hope to see you again soon.',
    isEnabled: true,
    createdBy: 'system',
    updatedBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const messageFormatsService = {
  getMessageFormats: async (guildId: string): Promise<MessageFormat[]> => {
    try {
      // Replace with actual API call when backend is ready
      return await apiClient.get<MessageFormat[]>(`/guilds/${guildId}/message-formats`);
    } catch (error) {
      console.error(`Error in getMessageFormats:`, error);
      return defaultMessageFormats;
    }
  },
  
  getMessageFormatById: async (guildId: string, id: string): Promise<MessageFormat | null> => {
    try {
      return await apiClient.get<MessageFormat>(`/guilds/${guildId}/message-formats/${id}`);
    } catch (error) {
      console.error(`Error in getMessageFormatById:`, error);
      return defaultMessageFormats.find(format => format.id === id) || null;
    }
  },
  
  createMessageFormat: async (guildId: string, data: Omit<MessageFormat, 'id' | 'guildId' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>): Promise<MessageFormat> => {
    try {
      return await apiClient.post<MessageFormat>(`/guilds/${guildId}/message-formats`, {
        ...data,
        guildId
      });
    } catch (error) {
      console.error(`Error in createMessageFormat:`, error);
      throw error;
    }
  },
  
  updateMessageFormat: async (guildId: string, id: string, data: Partial<MessageFormat>): Promise<MessageFormat> => {
    try {
      return await apiClient.put<MessageFormat>(`/guilds/${guildId}/message-formats/${id}`, data);
    } catch (error) {
      console.error(`Error in updateMessageFormat:`, error);
      throw error;
    }
  },
  
  deleteMessageFormat: async (guildId: string, id: string): Promise<void> => {
    try {
      await apiClient.delete<void>(`/guilds/${guildId}/message-formats/${id}`);
    } catch (error) {
      console.error(`Error in deleteMessageFormat:`, error);
      throw error;
    }
  }
};
