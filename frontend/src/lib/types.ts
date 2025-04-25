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

interface BaseTheme {
  id: string;
  title: string;
  thumbnail: string;
  summary: string;
  recommendations: number;
  views: number;
  playCount: number;
  authorId: string;
  playersMin: number;
  playersMax: number;
  playtime: number;
  price: number;
  difficulty: number;
  tags: string[];
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  type: 'CRIMESCENE' | 'ESCAPE_ROOM' | 'MURDER_MYSTERY' | 'REALWORLD';
}

interface CrimeSceneExtra {
  characters: string[];
}

export interface CrimeSceneTheme extends BaseTheme {
  type: 'CRIMESCENE';
  makerTeamsId: string;
  guildSnowflake: string;
  extra: CrimeSceneExtra;
}

export interface CrimeScenePage {
  themes: CrimeSceneTheme[];
  page: number;
  size: number;
}

export interface EscapeRoomTheme extends BaseTheme {
  type: 'ESCAPE_ROOM';
}

export interface EscapeRoomPage {
  themes: EscapeRoomTheme[];
  page: number;
  size: number;
}

export interface MurderMysteryTheme extends BaseTheme {
  type: 'MURDER_MYSTERY';
}

export interface MurderMysteryPage {
  themes: MurderMysteryTheme[];
  page: number;
  size: number;
}

export interface RealWorldTheme extends BaseTheme {
  type: 'REALWORLD';
}

export interface RealWorldTheme extends BaseTheme {
  themes: RealWorldTheme[];
  page: number;
  size: number;
}

export type Theme = CrimeSceneTheme | EscapeRoomTheme | MurderMysteryTheme | RealWorldTheme;
