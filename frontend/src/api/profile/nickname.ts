import { apiClient } from "@/lib/api";
import { NicknameCheckResponse } from "./types";

/**
 * 닉네임 중복 체크 API
 * @param nickname 중복 체크할 닉네임
 * @returns 사용 가능 여부 및 메시지
 */
export const checkNicknameDuplicate = async (
    nickname: string
): Promise<NicknameCheckResponse> => {
    try {
        const response = await apiClient.get<NicknameCheckResponse>(
            `/users/check-nickname?nickname=${encodeURIComponent(nickname)}`
        );
        return response.data;
    } catch (error) {
        console.error("닉네임 중복 확인 실패:", error);
        throw error;
    }
};
