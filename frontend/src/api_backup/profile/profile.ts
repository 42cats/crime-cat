import { apiClient } from "@/lib/api";
import { UserProfile, ProfileUpdateParams } from "./types";

/**
 * 프로필 정보 조회 API
 * @param userId 사용자 ID
 * @returns 사용자 프로필 정보
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
    try {
        const response = await apiClient.get<UserProfile>(
            `/web_user/profile/${userId}`
        );
        return response;
    } catch (error) {
        console.error("프로필 정보 조회 실패:", error);
        throw error;
    }
};

/**
 * 프로필 정보 업데이트 API
 * @param userId 사용자 ID
 * @param profileData 업데이트할 프로필 정보
 * @returns 업데이트된 사용자 프로필 정보
 */
export const updateUserProfile = async (
    userId: string,
    profileData: ProfileUpdateParams
): Promise<UserProfile> => {
    try {
        const formData = new FormData();

        // 1) avatar가 있으면 추가
        if (profileData.avatar) {
            formData.append("avatar", profileData.avatar);
        }

        // 2) JSON Blob으로 data 파트 추가
        //    WebUserProfileEditRequestDto DTO 필드명(social_links 등)에 맞춰
        //    profileData 객체의 키를 snake_case로 맞추거나,
        //    DTO에 @JsonProperty로 선언된 이름(social_links)을 사용해야 합니다.
        const payload = {
            nickname: profileData.nickname,
            bio: profileData.bio,
            badge: profileData.badge,
            socialLinks: profileData.socialLinks, // camelCase → snake_case 변환
            // emailAlert, discordAlert 등도 필요하다면 추가
        };
        const jsonBlob = new Blob([JSON.stringify(payload)], {
            type: "application/json",
        });
        formData.append("data", jsonBlob);

        // 3) headers 전체 생략 — 브라우저가 boundary 포함한 multipart/form-data 헤더를 자동 설정
        const response = await apiClient.put<UserProfile>(
            `/web_user/${userId}/profile`,
            formData
        );
        return response.data;
    } catch (error) {
        console.error("프로필 정보 업데이트 실패:", error);
        throw error;
    }
};

/**
 * 프로필 이미지만 업데이트하는 API
 * @param userId 사용자 ID
 * @param imageFile 업로드할 이미지 파일
 * @returns 업데이트된 이미지 URL
 */
export const updateProfileImage = async (
    userId: string,
    imageFile: File
): Promise<{ avatarUrl: string }> => {
    try {
        const formData = new FormData();
        formData.append("avatar", imageFile);

        const response = await apiClient.put<{ avatarUrl: string }>(
            `/web_user/${userId}/profile/avatar`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("프로필 이미지 업데이트 실패:", error);
        throw error;
    }
};

/**
 * 소셜 링크 업데이트 API
 * @param userId 사용자 ID
 * @param socialLinks 업데이트할 소셜 링크 정보
 * @returns 업데이트된 소셜 링크 정보
 */
export const updateSocialLinks = async (
    userId: string,
    socialLinks: { instagram?: string; x?: string; openkakao?: string }
): Promise<any> => {
    try {
        const response = await apiClient.put(
            `/web_user/${userId}/profile/social-links`,
            { socialLinks }
        );
        return response.data;
    } catch (error) {
        console.error("소셜 링크 업데이트 실패:", error);
        throw error;
    }
};
