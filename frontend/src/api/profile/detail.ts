import { apiClient } from "@/lib/api";

/**
 * 프로필 상세 정보 인터페이스
 */
export interface ProfileDetailDto {
    userId: string;
    userNickname: string;
    avatarImage: string | null;
    bio: string | null;
    point: number;
    playCount: number;
    socialLinks?: Record<string, string>;
}

/**
 * 사용자 프로필 상세 정보 조회 API
 * @param userId 사용자 ID
 * @returns 프로필 상세 정보
 */
export const getProfileDetail = async (
    userId: string
): Promise<ProfileDetailDto> => {
    try {
        // userId가 유효한지 간단히 검사
        if (!userId || userId.trim() === "") {
            throw new Error("Invalid user ID");
        }

        const response = await apiClient.get<ProfileDetailDto>(
            `/public/web_users/${userId}/profile/detail`,
            {
                headers: {
                    Accept: "application/json",
                },
            }
        );
        return response;
    } catch (error) {
        console.error(`프로필 상세 정보 조회 실패:`, error);
        throw error;
    }
};
