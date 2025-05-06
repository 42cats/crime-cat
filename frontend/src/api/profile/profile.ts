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
            `/users/${userId}/profile`
        );
        return response.data;
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
        // 이미지가 포함된 경우 FormData로 처리
        if (profileData.avatar) {
            const formData = new FormData();

            // 이미지 추가
            formData.append("avatar", profileData.avatar);

            // 나머지 데이터는 JSON 형태로 추가
            const profileDataWithoutAvatar = { ...profileData };
            delete profileDataWithoutAvatar.avatar;
            formData.append("data", JSON.stringify(profileDataWithoutAvatar));

            const response = await apiClient.put(
                `/users/${userId}/profile`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            return response.data;
        } else {
            // 이미지가 없는 경우 일반 JSON 요청
            const response = await apiClient.put<UserProfile>(
                `/users/${userId}/profile`,
                profileData
            );
            return response.data;
        }
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
            `/users/${userId}/profile/avatar`,
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
            `/users/${userId}/profile/social-links`,
            { socialLinks }
        );
        return response.data;
    } catch (error) {
        console.error("소셜 링크 업데이트 실패:", error);
        throw error;
    }
};
