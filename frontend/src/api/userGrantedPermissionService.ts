import { apiClient } from "@/lib/api";

export interface UserGrantedPermissionDto {
    permissionId: string;
    permissionName: string;
    expiredDate: string;
}

export interface UserGrantedPermissionResponseDto {
    userSnowflake: string;
    permissions: UserGrantedPermissionDto[];
}

export const userGrantedPermissionService = {
    fetchPermissions: (userId: string) =>
        apiClient.get<UserGrantedPermissionResponseDto>(
            `/bot/v1/user/${userId}/permissions`
        ),
};
