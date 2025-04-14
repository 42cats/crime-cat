import { Command } from '@/lib/types';
import { apiClient } from '@/lib/api';
const commandFiles = import.meta.glob('@/data/commands/*.json', { eager: true });
// 기본 명령어 데이터 (예비용)
const loadAllCommands = (): Command[] => {
  return Object.values(commandFiles).map((mod: any) => mod.default as Command);
};

const getStoredCommands = (): Command[] => {
  const stored = loadAllCommands();
  return stored ? stored : [];
};

const updateStoredCommands = (commands: Command[]) => {
  localStorage.setItem('commands', JSON.stringify(commands));
};

export const commandsService = {
  getCommands: async (): Promise<Command[]> => {
    try {
      return getStoredCommands();
    } catch (error) {
      console.error('명령어 불러오기 오류:', error);
      return [];
    }
  },

  getCommandById: async (id: string): Promise<Command | null> => {
    try {
      const commands = getStoredCommands();
      return commands.find(c => c.id === id) || null;
    } catch (error) {
      console.error('ID로 명령어 조회 실패:', error);
      return null;
    }
  },

  createCommand: async (data: Omit<Command, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>, userRole: string): Promise<Command> => {
    try {
      if (userRole !== 'admin' && userRole !== 'super') {
        throw new Error('명령어를 생성할 권한이 없습니다.');
      }

      const commands = getStoredCommands();
      const newCommand: Command = {
        ...data,
        id: Date.now().toString(),
        createdBy: userRole,
        updatedBy: userRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      commands.push(newCommand);
      updateStoredCommands(commands);
      return newCommand;
    } catch (error) {
      console.error('명령어 생성 실패:', error);
      throw error;
    }
  },

  updateCommand: async (id: string, data: Partial<Command>, userRole: string): Promise<Command> => {
    try {
      if (userRole !== 'admin' && userRole !== 'super') {
        throw new Error('명령어를 수정할 권한이 없습니다.');
      }

      const commands = getStoredCommands();
      const index = commands.findIndex(c => c.id === id);

      if (index === -1) {
        throw new Error('해당 명령어를 찾을 수 없습니다.');
      }

      commands[index] = {
        ...commands[index],
        ...data,
        updatedBy: userRole,
        updatedAt: new Date().toISOString()
      };

      updateStoredCommands(commands);
      return commands[index];
    } catch (error) {
      console.error('명령어 수정 실패:', error);
      throw error;
    }
  },

  deleteCommand: async (id: string, userRole: string): Promise<void> => {
    try {
      if (userRole !== 'admin' && userRole !== 'super') {
        throw new Error('명령어를 삭제할 권한이 없습니다.');
      }

      const commands = getStoredCommands();
      const index = commands.findIndex(c => c.id === id);

      if (index === -1) {
        throw new Error('해당 명령어를 찾을 수 없습니다.');
      }

      commands.splice(index, 1);
      updateStoredCommands(commands);
    } catch (error) {
      console.error('명령어 삭제 실패:', error);
      throw error;
    }
  }
};
