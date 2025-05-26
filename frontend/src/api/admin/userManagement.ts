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

    // 사용자 차단 (사유와 기간 포함)
    blockUserWithReason: (userId: string, reason: string, expiresAt?: string) => {
        return apiClient.post("/admin/users/block-with-reason", {
            userId,
            blockReason: reason,
            blockExpiresAt: expiresAt || null,
        });
    },

    // 사용자 차단 정보 조회
    getBlockInfo: (userId: string) => {
        return apiClient.get(`/admin/users/${userId}/block-info`);
    },

    // 현재 사용자 차단 상태 확인 (공개 API)
    getCurrentUserBlockStatus: () => {
        return apiClient.get("/auth/block-status");
    },

    // 사용자 권한 관리
    getUserPermissions: (userId: string) => {
        return apiClient.get(`/admin/users/${userId}/permissions`);
    },

    // 사용자에게 권한 부여
    grantPermission: (userId: string, permissionName: string, expiresAt?: string) => {
        return apiClient.post("/admin/users/permissions/grant", {
            userId,
            permissionName,
            expiresAt,
        });
    },

    // 사용자 권한 해제
    revokePermission: (userId: string, permissionName: string) => {
        return apiClient.post("/admin/users/permissions/revoke", {
            userId,
            permissionName,
        });
    },
};
