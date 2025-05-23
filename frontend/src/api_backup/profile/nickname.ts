import { apiClient } from "@/lib/api";

// API 응답 형식에 맞게 타입 정의
/**
 * 현재 API 응답 형식
 * { message: "사용 가능한 닉네임입니다.", available: true }
 */
interface NicknameAvailableResponse {
    message: string;
    available: boolean;
}

/**
 * 닉네임 중복 체크 API
 * @param nickname 중복 체크할 닉네임
 * @returns 사용 가능 여부 및 메시지
 */
export const checkNicknameDuplicate = async (
    nickname: string
): Promise<NicknameAvailableResponse> => {
    try {
        // API는 { message: "사용 가능한 닉네임입니다.", available: true } 형태로 반환
        const response = await apiClient.get<NicknameAvailableResponse>(
            `/web_user/check-nickname?nickname=${encodeURIComponent(nickname)}`
        );
        console.log("받은 닉네임 중복 체크 응답:", response);
        return response; // response가 아닌 response.data를 반환해야 함
    } catch (error) {
        console.error("닉네임 중복 확인 실패:", error);
        throw error;
    }
};
