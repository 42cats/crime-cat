import { Theme } from '@/lib/types';

// Vite 전용: themes 폴더 내 모든 JSON 동기 로드
const modules = import.meta.glob('@/data/themes/*.json', { eager: true });

// Theme[] 생성
const defaultThemes: Theme[] = Object.values(modules).map((mod: any) => mod.default || mod) as Theme[];

// 저장된 테마 불러오기
const getStoredThemes = (): Theme[] => {
  return defaultThemes;
};

// 저장된 테마 업데이트 (로컬에서만 사용됨)
const updateStoredThemes = (themes: Theme[]) => {
  localStorage.setItem('themes', JSON.stringify(themes));
};

// 테마 관련 서비스 정의
export const themesService = {
  // 모든 테마 가져오기
  getThemes: async (): Promise<Theme[]> => {
    try {
      return getStoredThemes();
    } catch (error) {
      console.error('테마 목록 가져오기 실패:', error);
      return defaultThemes;
    }
  },

  // 특정 ID의 테마 가져오기
  getThemeById: async (id: string): Promise<Theme | null> => {
    try {
      const themes = getStoredThemes();
      return themes.find((t) => t.id === id) || null;
    } catch (error) {
      console.error(`ID로 테마 가져오기 실패:`, error);
      return null;
    }
  },

  // 테마 생성
  createTheme: async (
    data: Omit<Theme, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>
  ): Promise<Theme> => {
    try {
      const themes = getStoredThemes();
      const newTheme: Theme = {
        ...data,
        id: Date.now().toString(),
        createdBy: 'user',
        updatedBy: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      themes.push(newTheme);
      updateStoredThemes(themes);
      return newTheme;
    } catch (error) {
      console.error(`테마 생성 실패:`, error);
      throw error;
    }
  },

  // 테마 수정
  updateTheme: async (id: string, data: Partial<Theme>, password?: string): Promise<Theme> => {
    try {
      const themes = getStoredThemes();
      const index = themes.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('테마를 찾을 수 없습니다.');
      if (themes[index].password && password !== themes[index].password) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      themes[index] = {
        ...themes[index],
        ...data,
        updatedBy: 'user',
        updatedAt: new Date().toISOString()
      };
      updateStoredThemes(themes);
      return themes[index];
    } catch (error) {
      console.error(`테마 수정 실패:`, error);
      throw error;
    }
  },

  // 테마 삭제
  deleteTheme: async (id: string, password?: string): Promise<void> => {
    try {
      const themes = getStoredThemes();
      const index = themes.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('테마를 찾을 수 없습니다.');
      if (themes[index].password && password !== themes[index].password) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      themes.splice(index, 1);
      updateStoredThemes(themes);
    } catch (error) {
      console.error(`테마 삭제 실패:`, error);
      throw error;
    }
  },

  // 비밀번호 확인
  verifyThemePassword: async (id: string, password: string): Promise<boolean> => {
    try {
      const theme = await themesService.getThemeById(id);
      if (!theme) throw new Error('테마를 찾을 수 없습니다.');
      return theme.password === password;
    } catch (error) {
      console.error(`비밀번호 검증 실패:`, error);
      return false;
    }
  }
};
