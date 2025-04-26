import { User, Guild, Guilds } from "@/lib/types";
import { apiClient } from "@/lib/api";

export const authService = {
    getCurrentUser: async (): Promise<User | null> => {
        try {
            return await apiClient.get<User>("/auth/me");
        } catch (error) {
            console.error("Error in getCurrentUser:", error);
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
};
