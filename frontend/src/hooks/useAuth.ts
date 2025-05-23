import { useRecoilState } from "recoil";
import { userState, isLoadingState } from "@/atoms/auth";
import { authService } from '@/api/auth';
import { isUser } from "@/utils/guard";
import { UserRole } from "@/lib/types";

export const useAuth = () => {
    const [user, setUser] = useRecoilState(userState);
    const [isLoading, setIsLoading] = useRecoilState(isLoadingState);

    const getCurrentUser = async () => {
        setIsLoading(true);
        try {
            const user = await authService.getCurrentUser();
            if (isUser(user)) {
                if (!user?.profile_image_path) {
                    user.profile_image_path =
                        "https://cdn.discordapp.com/embed/avatars/1.png";
                }
                if (!user?.snowflake) {
                    user.snowflake = ""; // 없으면 빈 문자열로 초기화
                }
                setUser(user);
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const hasRole = (roles: string[]) => {
        return user != null && roles.includes(user.role);
    };

    const login = async (username?: string, password?: string) => {
        const user = await authService.login(username, password);
        setUser(user);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        hasRole,
        login,
        logout,
        getCurrentUser,
    };
};
