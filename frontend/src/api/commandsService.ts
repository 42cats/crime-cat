import { apiClient } from '@/lib/api';
import { Command } from '@/lib/types';

export const commandsService = {
	getCommands: async (): Promise<Command[]> => {
	  try {
		return await apiClient.get<Command[]>('/commands');
	  } catch (error) {
		console.error('명령어 불러오기 오류:', error);
		return [];
	  }
	},
  
	getCommandById: async (id: string): Promise<Command | null> => {
	  try {
		return await apiClient.get<Command>(`/commands/${id}`);
	  } catch (error) {
		console.error('ID로 명령어 조회 실패:', error);
		return null;
	  }
	},
  
	createCommand: async (
	  data: Omit<Command, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>
	): Promise<Command> => {
	  try {
		return await apiClient.post<Command>('/commands', data);
	  } catch (error) {
		console.error('명령어 생성 실패:', error);
		throw error;
	  }
	},
  
	updateCommand: async (
	  id: string,
	  data: Partial<Command>
	): Promise<Command> => {
	  try {
		return await apiClient.patch<Command>(`/commands/${id}`, data);
	  } catch (error) {
		console.error('명령어 수정 실패:', error);
		throw error;
	  }
	},
  
	deleteCommand: async (id: string): Promise<void> => {
	  try {
		await apiClient.delete(`/commands/${id}`);
	  } catch (error) {
		console.error('명령어 삭제 실패:', error);
		throw error;
	  }
	},
  };
