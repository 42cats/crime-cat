import { apiClient } from "@/lib/api";
import { Team, Teams, TeamMember } from "@/lib/types";

const publicBaseURI = "/public/teams";
const baseURI = "/teams";

export const teamsService = {
    getMyTeams: async (): Promise<Team[]> => {
        try {
            const response = await apiClient.get<{ teams: Team[] }>(`${baseURI}/me`);
            console.log("내 팀 목록 조회 응답:", response); // 디버깅용 로그
            // 백엔드가 { teams: [...] } 형태로 반환하므로 teams 배열을 추출
            return response.teams || [];
        } catch (error) {
            console.error("내 팀 목록 조회 오류:", error);
            throw error;
        }
    },

    getTeams: async (memberId: string): Promise<Team[]> => {
        try {
            const response = await apiClient.get<Teams>(
                `${publicBaseURI}?memberId=${memberId}`
            );
            return response.teams;
        } catch (error) {
            console.error("팀 목록 조회 오류:", error);
            throw error;
        }
    },

    getTeamById: async (id: string): Promise<Team | null> => {
        try {
            return await apiClient.get<Team>(`${baseURI}/${id}`);
        } catch (error) {
            console.error("팀 ID로 조회 실패:", error);
            throw error;
        }
    },

    getTeamWithAvatars: async (id: string): Promise<Team | null> => {
        try {
            return await apiClient.get<Team>(
                `${publicBaseURI}/${id}/with-avatars`
            );
        } catch (error) {
            console.error("아바타 포함 팀 조회 실패:", error);
            throw error;
        }
    },

    createTeam: async (data: Omit<Team, "id" | "members">): Promise<Team> => {
        try {
            const response = await apiClient.post<Team>(`${baseURI}`, data);
            console.log("팀 생성 응답:", response); // 디버깅용 로그
            return response;
        } catch (error) {
            console.error("팀 생성 실패:", error);
            throw error;
        }
    },

    modifyTeamMember: async (
        id: string,
        userId: string,
        data: { name?: string; leader?: boolean }
    ): Promise<void> => {
        try {
            await apiClient.put<void>(
                `${baseURI}/${id}/members/${userId}`,
                data
            );
        } catch (error) {
            console.error("팀 멤버 변경 실패:", error);
            throw error;
        }
    },

    updateTeamMember: async (
        id: string,
        data: { members: { userId?: string; name?: string }[] }
    ): Promise<void> => {
        try {
            await apiClient.post<void>(`${baseURI}/${id}/members`, data);
        } catch (error) {
            console.error("팀 멤버 수정 실패:", error);
            throw error;
        }
    },

    deleteTeamMember: async (
        teamId: string,
        data: { members: string[] }
    ): Promise<{ failed?: string[] }> => {
        try {
            const res = await apiClient.patch<{ failed?: string[] }>(
                `/teams/${teamId}/members`,
                data
            );
            return res;
        } catch (error) {
            console.error("팀 멤버 삭제 실패:", error);
            throw error;
        }
    },

    deleteTeam: async (id: string): Promise<void> => {
        try {
            await apiClient.delete(`${baseURI}/${id}`);
        } catch (error) {
            console.error("팀 삭제 실패:", error);
            throw error;
        }
    },
};
