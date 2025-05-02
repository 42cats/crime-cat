import { apiClient } from '@/lib/api';
import { Team, Teams, TeamMember } from '@/lib/types';

const publicBaseURI = '/public/teams';
const baseURI = '/teams';

export const teamsService = {
  getTeams: async (memberId : string): Promise<Team[]> => {
    try {
      const response = await apiClient.get<Teams>(`${publicBaseURI}?memberId=${memberId}`);
      return response.teams;
    } catch (error) {
      console.error('팀 목록 조회 오류:', error);
      throw error;
    }
  },

  getTeamById: async (id: string): Promise<Team | null> => {
    try {
      return await apiClient.get<Team>(`${baseURI}/${id}`);
    } catch (error) {
      console.error('팀 ID로 조회 실패:', error);
      throw error;
    }
  },

  createTeam: async (
    data: Omit<Team, 'id' | 'members'>
  ): Promise<void> => {
    try {
      await apiClient.post<void>(`${baseURI}`, data);
    } catch (error) {
      console.error('팀 생성 실패:', error);
      throw error;
    }
  },

  updateTeamMember: async (
    id: string,
    data: Partial<TeamMember>
  ): Promise<void> => {
    try {
      await apiClient.post<void>(`${baseURI}/${id}/members`, data);
    } catch (error) {
      console.error('팀 멤버 수정 실패:', error);
      throw error;
    }
  },

  deleteTeamMember: async (
    id: string,
    data: Partial<TeamMember[]>,
  ): Promise<void> => {
    try {
      await apiClient.patch<void>(`${baseURI}/${id}/members`, data);
    } catch (error) {
      console.error('팀 멤버 삭제 실패: ', error);
      throw error;
    }
  },

  deleteTeam: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`${baseURI}/${id}`);
    } catch (error) {
      console.error('팀 삭제 실패:', error);
      throw error;
    }
  },
};
