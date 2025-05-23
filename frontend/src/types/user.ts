export enum UserRole {
    USER = "USER",
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
    createdAt?: string;
    lastLoginAt?: string;
}
