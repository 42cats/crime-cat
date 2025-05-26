import { useRecoilState } from "recoil";
import { userState, isLoadingState } from "@/atoms/auth";
import { authService } from '@/api/auth';
import { isUser } from "@/utils/guard";
import { UserRole } from "@/lib/types";
import { BlockInfo } from "@/types/user";
import { useState, useCallback } from "react";

export const useAuth = () => {
    const [user, setUser] = useRecoilState(userState);
    const [isLoading, setIsLoading] = useRecoilState(isLoadingState);
    const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);

    const getCurrentUser = useCallback(async () => {
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
        } catch (error: any) {
            if (error?.response?.status === 403 && error?.response?.data?.error === 'ACCOUNT_BLOCKED') {
                // 차단된 계정 처리
                const blockData = error.response.data;
                setBlockInfo({
                    isBlocked: true,
                    blockReason: blockData.blockReason || '사유를 알 수 없습니다.',
                    blockedAt: blockData.blockedAt || undefined,
                    blockExpiresAt: blockData.blockExpiresAt || undefined,
                    isPermanent: !blockData.blockExpiresAt,
                });
                setIsBlocked(true);
            } else {
                setUser(null);
                setBlockInfo(null);
                setIsBlocked(false);
            }
        } finally {
            setIsLoading(false);
        }
    }, [setUser, setIsLoading]);

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
        blockInfo,
        isBlocked,
    };
};
