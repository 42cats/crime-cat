import { apiClient } from "@/lib/api";

export interface UserGrantedPermissionDto {
    permissionId: string;
    permissionName: string;
    expiredDate: string;
    info?: string;
}

export const userGrantedPermissionService = {
    fetchPermissions: (userId: string) =>
        apiClient.get<UserGrantedPermissionDto[]>(
            `/web_user/${userId}/permissions`
        ),
};
