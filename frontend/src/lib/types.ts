export type UserRole = "USER" | "ADMIN" | "MANAGER";

export interface UserSetting {
    notifyByEmail: boolean;
    notifyByDiscord: boolean;
}
export interface AuthorDto {
    id: string;
    nickname: string;
    avatarUrl: string | null;
}

export interface TeamDto {
    id: string;
    name: string;
}

export interface GuildDto {
    snowflake: string;
    name: string;
    ownerSnowflake: string;
    createdAt: string; // ISO 8601 문자열 (LocalDateTime → string)
}

export type ThemeTypes =
    | "ESCAPE_ROOM"
    | "CRIMESCENE"
    | "REALWORLD"
    | "MURDER_MYSTERY";

/**
 * 기본 테마 상세 타입
 */
export interface ThemeDetailType {
    id: string;
    title: string;
    thumbnail: string;
    summary: string;
    recommendations: number;
    views: number;
    playCount: number;
    author: AuthorDto | null;
    playersMin: number;
    playersMax: number;
    playTimeMin: number;
    playTimeMax: number;
    price: number;
    difficulty: number;
    tags: string[];
    content: string;
    publicStatus: boolean;
    createdAt: string;
    updatedAt: string;
    recommendationEnabled: boolean;
    commentEnabled: boolean;
    type: ThemeType;
}

/**
 * 범죄현장 테마 상세 타입 (확장된 필드 포함)
 */
export interface CrimesceneThemeDetailType extends ThemeDetailType {
    team: TeamDto | null;
    guild: GuildDto | null;
    guildSnowflake: string;
    extra: Record<string, any>; // JSON 형태의 유동적 필드
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
    usageExample: string;
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
    usageExample: string;
    category: string;
    requiredPermissions: string[];
    content: string;
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

export interface AdditionalUserInfo {
    themePlayCount?: string; // 총 플레이한 테마 수
    recentlyPlayCrimeSeenTheme?: string; // 최근 플레이한 테마 이름
    recentlyPlayCrimeSeenThemeTime?: string; // 최근 플레이한 시간 (UTC ISO-8601)
    mostFavoriteCrimeSeenMaker?: string; // 가장 자주 플레이한 제작자
}

interface AuthorInfo {
    id: string;
    nickname: string;
    avatarUrl;
}

interface BaseTheme {
    id: string;
    title: string;
    thumbnail: string;
    summary: string;
    recommendations: number;
    views: number;
    playCount: number;
    author: AuthorInfo;
    playersMin: number;
    playersMax: number;
    playTimeMin: number;
    playTimeMax: number;
    price: number;
    difficulty: number;
    tags: string[];
    content: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    recommendationEnabled: boolean;
    commentEnabled: boolean;
    type: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD";
}

interface CrimeSceneExtra {
    characters: string[];
}

interface GuildInfo {
    snowflake: string;
    name: string;
    onwerSnowflake: string;
    createAt: string;
}

interface TeamInfo {
    id: string;
    name: string;
}

export interface CrimeSceneTheme extends BaseTheme {
    type: "CRIMESCENE";
    team: TeamInfo;
    guild: GuildInfo;
    extra: CrimeSceneExtra;
}

export interface EscapeRoomTheme extends BaseTheme {
    type: "ESCAPE_ROOM";
}

export interface MurderMysteryTheme extends BaseTheme {
    type: "MURDER_MYSTERY";
}

export interface RealWorldTheme extends BaseTheme {
    type: "REALWORLD";
}

interface BaseThemeInput {
    title: string;
    thumbnail: File;
    summary: string;
    playerMin: number;
    playerMax: number;
    playtimeMix: number;
    playtimeMax: number;
    price: number;
    difficulty: number;
    tags: string[];
    content: string;
    isPublic: boolean;
    recommendationEnabled: boolean;
    commentEnabled: boolean;
}

export interface CrimeSceneInput extends BaseThemeInput {
    type: "CRIMESCENE";
    makerTeamsId: string;
    guildSnowflake: string;
    extra: {
        characters: string[];
    };
}

export interface EscapeRoomInput extends BaseThemeInput {
    type: "ESCAPE_ROOM";
}

export interface MurderMysteryInput extends BaseThemeInput {
    type: "MURDER_MYSTERY";
}

export interface RealWorldInput extends BaseThemeInput {
    type: "REALWORLD";
}

export type Theme =
    | CrimeSceneTheme
    | EscapeRoomTheme
    | MurderMysteryTheme
    | RealWorldTheme;
export type ThemeType = {
    theme: Theme;
};
export type ThemePage = {
    themes: Theme[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
};
export type ThemeInput =
    | CrimeSceneInput
    | EscapeRoomInput
    | MurderMysteryInput
    | RealWorldInput;

export type Like = {
    status: boolean;
};

export interface TeamMember {
    id: string;
    userId?: string;
    name?: string;
    leader?: boolean;
    avatarUrl?: string;
}

export interface Team {
    id: string;
    name: string;
    members?: TeamMember[];
    count: Number;
}

export interface Teams {
    teams: Team[];
}

export interface GuildDetail {
    guildId: string;
    guildName: string;
    guildOwnerName: string;
    guildIcon: string;
    guildOnlineMemeberCount: number;
    guildMemberCount: number;
    totalHistoryUserCount: number;
    guildCreatedAt: string;
    lastPlayTime: string;
}

export interface SearchUser {
    id: string;
    nickname: string;
}

export interface SearchUsers {
    content: SearchUser[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
    searchType: string;
}
