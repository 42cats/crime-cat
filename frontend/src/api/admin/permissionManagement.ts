import { apiClient } from "@/lib/api";

export interface Permission {
    id: string;
    name: string;
    price: number;
    duration: number;
    info?: string;
}

export interface SavePermissionRequest {
    name: string;
    price: number;
    duration?: number;
    info?: string;
}

export interface ModifyPermissionRequest {
    name?: string;
    price?: number;
    duration?: number;
}

export interface PermissionResponse {
    message: string;
}

export interface PermissionsResponse {
    message: string;
    permissions: Permission[];
}

const baseURI = "/admin/permissions";

export const permissionManagementService = {
    // 모든 권한 조회
    getAllPermissions: async (): Promise<PermissionsResponse> => {
        try {
            return await apiClient.get<PermissionsResponse>(baseURI);
        } catch (error) {
            console.error("권한 목록 조회 실패:", error);
            throw error;
        }
    },

    // 권한 생성
    createPermission: async (data: SavePermissionRequest): Promise<PermissionResponse> => {
        try {
            return await apiClient.post<PermissionResponse>(baseURI, data);
        } catch (error) {
            console.error("권한 생성 실패:", error);
            throw error;
        }
    },

    // 권한 수정
    updatePermission: async (permissionName: string, data: ModifyPermissionRequest): Promise<PermissionResponse> => {
        try {
            return await apiClient.patch<PermissionResponse>(`${baseURI}/${permissionName}`, data);
        } catch (error) {
            console.error("권한 수정 실패:", error);
            throw error;
        }
    },

    // 권한 삭제
    deletePermission: async (permissionName: string): Promise<PermissionResponse> => {
        try {
            return await apiClient.delete<PermissionResponse>(`${baseURI}/${permissionName}`);
        } catch (error) {
            console.error("권한 삭제 실패:", error);
            throw error;
        }
    },
};
