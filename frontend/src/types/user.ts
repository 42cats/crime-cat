export enum UserRole {
    USER = "USER",
    CREATOR = "CREATOR",
    MANAGER = "MANAGER",
    ADMIN = "ADMIN"
}

export interface User {
    id: string;
    email: string;
    nickname: string;
    profile_image_path: string;
    role: UserRole;
    emailVerified: boolean;
    isBlocked?: boolean;
    blocked?: boolean;  // 백엔드 JSON 응답에서 사용
    blockReason?: string;
    blockedAt?: string;
    blockExpiresAt?: string;
    createdAt?: string;
    lastLoginAt?: string;
}

export interface BlockInfo {
    isBlocked: boolean;
    blockReason?: string;
    blockedAt?: string;
    blockExpiresAt?: string;
    isPermanent?: boolean;
}
