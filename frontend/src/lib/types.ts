export type UserRole = "USER" | "ADMIN" | "MANAGER";

export interface UserSetting {
    notifyByEmail: boolean;
    notifyByDiscord: boolean;
}

export interface SocialLinks {
    instagram?: string;
    x?: string;
    openkakao?: string;
}

export interface User {
    id: string;
    nickname: string;
    role: UserRole;
    profile_image_path?: string;
    setting?: UserSetting;
    social_links?: SocialLinks;
    bio?: string;
    title?: string;
    badge?: string;
    snowflake?: string;
    last_login_at?: string;
    is_active?: boolean;
    point?: number;
}

export interface Channel {
    id: string;
    name: string;
}

export interface ContentData {
    id: string;
    channelId: string;
    text: string;
    index: number;
    buttonId?: string;
}

export interface ButtonData {
    id: string;
    name: string;
    contents: ContentData[];
    index: number;
    groupId: string;
    guildId: string;
}

export interface GroupData {
    id: string;
    name: string;
    buttons: ButtonData[];
    index: number;
}

export interface DraggableItem {
    id: string;
    type: "group" | "button";
    index: number;
    parentId?: string;
}

export type ItemPosition = {
    id: string;
    type: "group" | "button";
    newIndex: number;
    newParentId?: string;
};

export interface Command {
    id: string;
    name: string;
    description: string;
    usage: string;
    category: string;
    requiredPermissions: string[];
    content?: string;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CommandInput {
    name: string;
    description: string;
    usage: string;
    category: string;
    requiredPermissions: string[];
    content: string;
}

export interface Theme {
    id: string;
    title: string;
    thumbnail: string;
    description: string;
    recommendations: number;
    content: string;
    tags: string[];
    password: string;
    makers: string[];
    players: string;
    characters: string[];
    price: number;
    time: number;
    contact?: string;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface Guild {
    id: string;
    name: string;
    owner: boolean;
    icon: string;
    approximate_member_count: number;
    approximate_presence_count: number;
    permissions: number;
}

export interface Guilds {
    guilds: Guild[];
}

export interface MessageFormat {
    id: string;
    guildId: string;
    formatType: "welcome" | "goodbye" | "announcement" | "custom";
    content: string;
    isEnabled: boolean;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface Place {
    title: string;
    address: string;
    roadAddress: string;
    link: string;
    lat?: number;
    lng?: number;
}

export interface DailyCheck {
    isComplete: boolean;
    checkTime: string;
}

export interface Coupon {
    point: number;
}

export interface Stats {
    totalUsers: number;
    totalServers: number;
    totalPlayers: number;
    totalCreators: number;
    totalThemes: number;
}

export type NoticeType = "SYSTEM" | "EVENT" | "UPDATE";

export interface Notice {
    id: string;
    title: string;
    content: string;
    summary: string;
    noticeType: "SYSTEM" | "EVENT" | "UPDATE";
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NoticePage {
    content: Notice[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface NoticeInput {
    title: string;
    content: string;
    summary: string;
    noticeType: NoticeType;
    isPinned: boolean;
}
