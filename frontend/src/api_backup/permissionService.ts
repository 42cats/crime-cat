import { apiClient } from "@/lib/api";

export interface Permission {
    permissionId: string;
    permissionName: string;
    price: number;
    duration: number;
    info?: string;
}

export interface PermissionWithStatus extends Permission {
    isOwned: boolean;
    expiredDate?: string;
    canExtend: boolean;
}

export interface AllPermissionsResponse {
    permissions: PermissionWithStatus[];
    message: string;
}

export interface PurchaseResponse {
    success: boolean;
    message: string;
    data?: {
        point: number;
    };
}

export interface ExtendResponse {
    message: string;
    expiredDate: string;
}

export const permissionService = {
    // 기존: 사용자가 가진 권한만 조회
    getUserPermissions: (userId: string) =>
        apiClient.get<Permission[]>(`/permissions/user/${userId}`),

    // 신규: 모든 권한과 사용자 보유 상태 조회
    getAllPermissionsWithStatus: (userId: string) =>
        apiClient.get<AllPermissionsResponse>(`/permissions/user/${userId}/all`),

    // 신규: 권한 구매
    purchasePermission: (userId: string, permissionId: string) =>
        apiClient.post<PurchaseResponse>(`/permissions/user/${userId}/purchase`, {
            permissionId,
        }),

    // 신규: 권한 연장
    extendPermission: (userId: string, permissionId: string) =>
        apiClient.patch<ExtendResponse>(`/permissions/user/${userId}/${permissionId}/extend`),
};
