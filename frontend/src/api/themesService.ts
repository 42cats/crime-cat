import { Theme, ThemePage } from '@/lib/types';
import { apiClient } from '@/lib/api';
 
const baseURI = '/themes';

export const themesService = {
  getLatestThemes: async (
    category: 'CRIMESCENE' | 'ESCAPE_ROOM' | 'MURDER_MYSTERY' | 'REALWORLD'
  ): Promise<Theme[]> => {
    try {
    const response = await apiClient.get<ThemePage>(`${baseURI}?limit=5&page=0&category=${category}`);
    return response.themes;
    } catch (error) {
    console.error('최신 테마 불러오기 실패:', error);
    throw error;
    }
  },

  getThemeById: async (id: string): Promise<Theme> => {
    try {
      return await apiClient.get<Theme>(`${baseURI}/${id}`);
    } catch (error) {
      console.error(`테마 ID로 조회 실패:`, error);
      throw error;
    }
  },

  createTheme: async (
    data: Omit<Theme, 'id' | 'authorId' | 'recommendations' | 'views' | 'playCount' | 'createdAt' | 'updatedAt'>
  ): Promise<Theme> => {
    try {
      return await apiClient.post<Theme>(`${baseURI}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error(`테마 생성 실패:`, error);
      throw error;
    }
  },

  updateTheme: async (id: string, data: Partial<Theme>): Promise<Theme> => {
    try {
      return await apiClient.post<Theme>(`${baseURI}/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error(`테마 수정 실패:`, error);
      throw error;
    }
  },

  deleteTheme: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`${baseURI}/${id}`);
    } catch (error) {
      console.error(`테마 삭제 실패:`, error);
      throw error;
    }
  },
};