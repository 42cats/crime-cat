import { apiClient } from "@/lib/api";
import { UserRole } from "@/types/user";

// 사용자 관리 API
export const userManagementApi = {
    // 모든 사용자 목록 조회
    getAllUsers: (params?: {
        page?: number;
        size?: number;
        sort?: string[];
    }) => {
        const searchParams = new URLSearchParams();
        if (params) {
            if (params.page !== undefined)
                searchParams.append("page", params.page.toString());
            if (params.size !== undefined)
                searchParams.append("size", params.size.toString());
            if (params.sort && params.sort.length > 0) {
                params.sort.forEach((sortOption) => {
                    searchParams.append("sort", sortOption);
                });
            }
        }
        const query = searchParams.toString();
        return apiClient.get(`/admin/users${query ? "?" + query : ""}`);
    },

    // 사용자 역할 변경
    changeUserRole: (userId: string, newRole: UserRole) => {
        return apiClient.post("/admin/users/change-role", {
            userId,
            newRole,
        });
    },

    // 사용자 포인트 지급
    addUserPoints: (userId: string, amount: number, reason?: string) => {
        return apiClient.post("/admin/users/add-points", {
            userId,
            amount,
            reason,
        });
    },

    // 사용자 포인트 차감
    subtractUserPoints: (userId: string, amount: number, reason?: string) => {
        return apiClient.post("/admin/users/subtract-points", {
            userId,
            amount,
            reason,
        });
    },

    // 사용자 차단
    blockUser: (userId: string) => {
        return apiClient.post(`/admin/users/${userId}/block`);
    },

    // 사용자 차단 해제
    unblockUser: (userId: string) => {
        return apiClient.post(`/admin/users/${userId}/unblock`);
    },
};
