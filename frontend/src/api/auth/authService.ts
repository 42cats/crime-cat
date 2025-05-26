import { User, Guild, Guilds } from "@/lib/types";
import { apiClient } from "@/lib/api";

// 재시도 횟수 추적을 위한 변수
let authMeRetryCount = 0;
const MAX_AUTH_ME_RETRIES = 2;

export const authService = {
    getCurrentUser: async (): Promise<User | null> => {
        try {
            // 재시도 횟수 초과 시 즉시 null 반환
            if (authMeRetryCount >= MAX_AUTH_ME_RETRIES) {
                console.log("auth/me 재시도 횟수 초과, null 반환");
                return null;
            }

            authMeRetryCount++;
            
            // auth/me 요청
            const user = await apiClient.get<User>("/auth/me");
            console.log(
                "getCurrentUser API 성공:",
                user ? "사용자 정보 있음" : "사용자 정보 없음"
            );
            
            // 성공 시 카운터 리셋
            authMeRetryCount = 0;
            return user;
        } catch (error) {
            console.error("Error in getCurrentUser API:", error);
            
            // 401 오류인 경우 null 반환, 그 외의 오류는 전파
            if (error.response?.status === 401) {
                console.log("인증되지 않은 사용자");
                // 401 에러 시 카운터 리셋 (다음 번 정상 요청을 위해)
                setTimeout(() => {
                    authMeRetryCount = 0;
                }, 5000); // 5초 후 리셋
                return null;
            }
            
            // 기타 에러도 카운터 리셋
            setTimeout(() => {
                authMeRetryCount = 0;
            }, 5000);
            
            throw error;
        }
    },

    getUserProfile: async (userId: string): Promise<User | null> => {
        try {
            return await apiClient.get<User>(`/users/${userId}`);
        } catch (error) {
            console.error(`Error in getUserProfile:`, error);
            throw error;
        }
    },

    login: async (code: string, role: string): Promise<User | null> => {
        try {
            let user: User;

            // 여기에 실제 로그인 로직 구현 필요
            // let response = await apiClient.post<User>("/auth/login", { code, role });
            // user = response;

            return user;
        } catch (error) {
            console.error("Error in login:", error);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        try {
            await apiClient.post<void>("/auth/logout", {});
        } catch (error) {
            console.error("Error in logout:", error);
            throw error;
        }
    },

    getUserGuilds: async (): Promise<Guild[]> => {
        try {
            const response = await apiClient.get<Guilds>("/auth/guilds");
            return response.guilds;
        } catch (error) {
            console.error("Error in getUserGuilds:", error);
            throw error;
        }
    },

    getGuildPublicStatus: async (guildId: string): Promise<boolean> => {
        try {
            const response = await apiClient.get<boolean>(
                `/auth/guilds/settings/${guildId}/public`
            );
            return response;
        } catch (error) {
            console.error("Error in getGuildPublicStatus:", error);
            throw error;
        }
    },

    toggleGuildPublicStatus: async (guildId: string): Promise<boolean> => {
        try {
            const response = await apiClient.patch<boolean>(
                `/auth/guilds/settings/${guildId}/public`
            );
            return response;
        } catch (error) {
            console.error("Error in toggleGuildPublicStatus:", error);
            throw error;
        }
    },
};
