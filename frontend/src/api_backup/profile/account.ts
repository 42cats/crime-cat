import { apiClient } from "@/lib/api";

/**
 * 계정 탈퇴 API
 * @param userId 사용자 ID
 * @param password 확인을 위한 비밀번호
 * @returns 성공 여부
 */
export const deleteAccount = async (
    userId: string,
    password: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await apiClient.delete(`/users/${userId}`, {
            data: { password },
        });
        return response.data;
    } catch (error) {
        console.error("계정 탈퇴 실패:", error);
        throw error;
    }
};

/**
 * 비밀번호 변경 API
 * @param userId 사용자 ID
 * @param currentPassword 현재 비밀번호
 * @param newPassword 새 비밀번호
 * @returns 성공 여부
 */
export const changePassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await apiClient.put(`/users/${userId}/password`, {
            currentPassword,
            newPassword,
        });
        return response.data;
    } catch (error) {
        console.error("비밀번호 변경 실패:", error);
        throw error;
    }
};

/**
 * 이메일 변경 API
 * @param userId 사용자 ID
 * @param newEmail 새 이메일
 * @param password 확인을 위한 비밀번호
 * @returns 성공 여부
 */
export const changeEmail = async (
    userId: string,
    newEmail: string,
    password: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await apiClient.put(`/users/${userId}/email`, {
            newEmail,
            password,
        });
        return response.data;
    } catch (error) {
        console.error("이메일 변경 실패:", error);
        throw error;
    }
};
