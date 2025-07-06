export type UserRole = "USER" | "ADMIN" | "MANAGER";

export interface UserSetting {
    notifyByEmail: boolean;
    notifyByDiscord: boolean;
}
export interface AuthorDto {
    id: string;
    nickname: string;
    avatarUrl?: string | null;
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
    author?: AuthorDto | null;
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
 * 크라임씬 테마 상세 타입 (확장된 필드 포함)
 */
export interface CrimesceneThemeDetailType extends ThemeDetailType {
    team: TeamDto | null;
    guild: GuildDto | null;
    guildSnowflake: string;
    extra: Record<string, any>; // JSON 형태의 유동적 필드
}

/**
 * 방탈출 테마 상세 타입 (확장된 필드 포함)
 */
export interface EscapeRoomThemeDetailType extends ThemeDetailType {
    horrorLevel?: number;
    deviceRatio?: number;
    activityLevel?: number;
    openDate?: string;
    isOperating?: boolean;

    locations?: EscapeRoomLocation[];
    homepageUrl?: string;
    reservationUrl?: string;
    allowGameHistory?: boolean;
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
    type?: number;           // Discord 채널 타입 번호 (0: 텍스트, 2: 음성, 4: 카테고리 등)
    typeKey?: string;        // 프론트엔드용 타입 키 ('text', 'voice', 'category' 등)
    displayName?: string;    // 사용자 친화적 타입명 ('텍스트 채널', '음성 채널' 등)
    emoji?: string;          // UI 표시용 이모지 ('💬', '🔊' 등)
    position?: number;       // 채널 정렬 순서
    parentId?: string;       // 부모 카테고리 ID
    topic?: string;          // 채널 주제 (선택적)
    nsfw?: boolean;          // NSFW 여부 (선택적)
}

export interface ContentData {
    id: string;
    channelId: string;
    roleId?: string;
    text: string;
    emoji?: string;
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

export interface EscapeRoomLocation {
    storeName: string; // 매장명
    address: string; // 주소
    roadAddress: string; // 도로명주소
    lat: number; // 위도
    lng: number; // 경도
    link: string; // 네이버 링크
    phone?: string; // 전화번호 (선택사항)
    description?: string; // 매장 설명 (선택사항)
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
    crimeThemes: number;
    escapeThemes: number;
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
    author: string | AuthorInfo; // API는 string ID를 반환
    playersMin: number;
    playersMax: number;
    playTimeMin: number;
    playTimeMax: number;
    price: number;
    difficulty: number;
    tags: string[];
    content?: string; // API 응답에 없을 수 있음
    isPublic?: boolean; // API 응답에 없을 수 있음
    createdAt?: string; // API 응답에 없을 수 있음
    updatedAt?: string; // API 응답에 없을 수 있음
    recommendationEnabled: boolean;
    commentEnabled?: boolean; // API 응답에 없을 수 있음
    type: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD";
    teamName?: string; // 크라임씬 테마의 제작팀 이름
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

    horrorLevel?: number; // 공포도 (1-10)
    deviceRatio?: number; // 장치비중 (1-10)
    activityLevel?: number; // 활동도 (1-10)
    openDate?: string; // 오픈날짜 (ISO 날짜)
    isOperating: boolean; // 현재 운용여부
    locations: EscapeRoomLocation[]; // 매장 위치 정보들
    homepageUrl?: string; // 홈페이지 URL
    reservationUrl?: string; // 예약 페이지 URL
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

    horrorLevel?: number; // 공포도 (1-10)
    deviceRatio?: number; // 장치비중 (1-10)
    activityLevel?: number; // 활동도 (1-10)
    openDate?: string; // 오픈날짜 (ISO 날짜)
    isOperating: boolean; // 현재 운용여부
    locations: EscapeRoomLocation[]; // 매장 위치 정보들
    homepageUrl?: string; // 홈페이지 URL
    reservationUrl?: string; // 예약 페이지 URL
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
    count: number;
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

// 방탈출 히스토리 관련 타입들
export interface EscapeRoomHistory {
    id: string;
    escapeRoomThemeId: string;
    escapeRoomThemeTitle: string;
    userId: string;
    userNickname: string;
    userAvatarUrl?: string;

    // 게임 결과
    isSuccess: boolean;
    escapeTimeMinutes?: number;
    formattedEscapeTime?: string;

    // 평가
    feltDifficulty: number; // 1-10
    feltDifficultyStars: number; // 0.5-5.0
    satisfaction: number; // 1-10
    satisfactionStars: number; // 0.5-5.0

    // 플레이 정보
    participantsCount: number;
    hintUsedCount: number;
    memo?: string; // 스포일러 보호 대상
    safeMemo?: string; // 마스킹된 메모 (권한 없을 때)
    storeLocation?: string;

    // 메타 정보
    isPublic: boolean; // 기록 공개/비공개
    hasSpoiler: boolean; // 스포일러 포함 여부
    playDate: string;
    createdAt: string;
    updatedAt?: string;

    // 권한 정보
    isAuthor: boolean;
    canViewMemo: boolean; // 메모 볼 수 있는 권한
    isVisible: boolean; // 기록 자체 볼 수 있는 권한
}

export interface EscapeRoomHistoryInput {
    escapeRoomThemeId: string;
    isSuccess: boolean;
    escapeTimeMinutes?: number;
    feltDifficulty: number; // 1-10
    participantsCount: number;
    hintUsedCount?: number;
    satisfaction: number; // 1-10
    memo?: string;
    isPublic?: boolean;
    playDate: string;
    hasSpoiler?: boolean;
    storeLocation?: string;
}

export interface EscapeRoomHistoryStats {
    totalRecords: number;
    publicRecords: number;
    successCount: number;
    failCount: number;
    successRate: number;

    // 평균 값들
    averageEscapeTime?: number;
    formattedAverageEscapeTime?: string;
    averageFeltDifficulty?: number;
    averageSatisfaction?: number;
    averageParticipants?: number;
    averageHintUsed?: number;

    // 별점 형태
    averageFeltDifficultyStars?: number;
    averageSatisfactionStars?: number;

    // 최고/최저 기록
    fastestEscapeTime?: number;
    formattedFastestTime?: string;
    slowestEscapeTime?: number;
    formattedSlowestTime?: string;
}

export interface EscapeRoomHistoryPage {
    content: EscapeRoomHistory[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// 방탈출 댓글 관련 타입들
export interface EscapeRoomComment {
    id: string;
    escapeRoomThemeId: string;
    escapeRoomHistoryId?: string; // 게임 기록 기반 댓글인 경우
    userId: string;
    userNickname: string;
    userAvatarUrl?: string;

    content: string;
    hasSpoiler: boolean; // 스포일러 포함 여부
    isDeleted: boolean;

    createdAt: string;
    updatedAt?: string;

    // 권한 및 메타 정보
    isAuthor: boolean;
    isVisible: boolean; // 댓글 볼 수 있는 권한
    isGameHistoryComment: boolean; // 게임 기록 기반 댓글인지
    isGeneralComment: boolean; // 일반 댓글인지
}

export interface EscapeRoomCommentInput {
    escapeRoomThemeId: string;
    escapeRoomHistoryId?: string; // 게임 기록 기반 댓글인 경우
    content: string;
    hasSpoiler?: boolean;
}

export interface EscapeRoomCommentPage {
    content: EscapeRoomComment[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
