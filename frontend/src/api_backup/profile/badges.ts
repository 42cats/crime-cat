import { apiClient } from "@/lib/api";
import { BadgeItem } from "./types";

/**
 * 사용자가 보유한 칭호(배지) 목록 조회 API
 * @param userId 사용자 ID
 * @returns 보유한 배지 목록
 */
export const getUserBadges = async (userId: string): Promise<BadgeItem[]> => {
    try {
        const response = await apiClient.get<BadgeItem[]>(
            `/users/${userId}/badges`
        );
        return response;
    } catch (error) {
        console.error("사용자 배지 목록 조회 실패:", error);
        throw error;
    }
};

/**
 * 표시할 칭호(배지) 선택 API
 * @param userId 사용자 ID
 * @param badgeId 선택한 배지 ID
 * @returns 응답 결과
 */
export const setActiveBadge = async (
    userId: string,
    badgeId: string | null
): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await apiClient.put<{ success: boolean; message?: string }>(`/users/${userId}/badges/active`, {
            badgeId: badgeId, // null을 보내면 배지 미설정
        });
        return response;
    } catch (error) {
        console.error("배지 설정 실패:", error);
        throw error;
    }
};

/**
 * 모든 사용 가능한 칭호(배지) 목록 조회 API
 * @returns 사용 가능한 모든 배지 목록
 */
export const getAllBadges = async (): Promise<BadgeItem[]> => {
    try {
        const response = await apiClient.get<BadgeItem[]>("/badges");
        return response;
    } catch (error) {
        console.error("배지 목록 조회 실패:", error);
        throw error;
    }
};
