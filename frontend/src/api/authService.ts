import { User } from "@/lib/types";
import { apiClient } from "@/lib/api";

// Mock users for demonstration
const mockUsers: { [key in User["role"]]: User } = {
    ADMIN: {
        id: "1",
        discordUserId: "123456789012345678",
        nickname: "Admin User",
        avatar: "https://cdn.discordapp.com/embed/avatars/1.png",
        role: "ADMIN" as const,
    },
    MANAGER: {
        id: "2",
        discordUserId: "234567890123456789",
        nickname: "Super User",
        avatar: "https://cdn.discordapp.com/embed/avatars/2.png",
        role: "MANAGER" as const,
    },
    USER: {
        id: "3",
        discordUserId: "345678901234567890",
        nickname: "Regular User",
        avatar: "https://cdn.discordapp.com/embed/avatars/3.png",
        role: "USER" as const,
    },
};

export const authService = {
    getCurrentUser: async (): Promise<User | null> => {
        try {
            return await apiClient.get<User>("/auth/me");
        } catch (error) {
            console.error("Error in getCurrentUser:", error);
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

    login: async (
        code: string,
        role: string = "visitor"
    ): Promise<User | null> => {
        try {
            // In a real app, this would call the API
            // For demo purposes, we'll use mock data
            let user: User;

            if (role === "ADMIN") {
                user = mockUsers.ADMIN;
            } else if (role === "MANAGER") {
                user = mockUsers.MANAGER;
            } else {
                user = mockUsers.USER;
            }

            // Store user in localStorage for persistence
            localStorage.setItem("currentUser", JSON.stringify(user));

            return user;
        } catch (error) {
            console.error("Error in login:", error);
            return null;
        }
    },

    logout: async (): Promise<void> => {
        try {
            await apiClient.post<void>("/auth/logout", {});
        } catch (error) {
            console.error("Error in logout:", error);
            return null;
        }
    },

    getUserGuilds: async (): Promise<any[]> => {
        try {
            const res = await apiClient.get<{ guilds: any[] }>("/auth/guilds");
            return res.guilds;
        } catch (error) {
            console.error("Error in getUserGuilds:", error);

            // Return mock guilds for demo
            return [];
        }
    },
};
