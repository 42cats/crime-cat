// 게시판 타입 정의
export enum BoardType {
    NONE = "NONE",
    QUESTION = "QUESTION", // 질문게시판
    CHAT = "CHAT", // 자유게시판
    CREATOR = "CREATOR", // 제작자게시판
}

export enum PostType {
    GENERAL = "GENERAL", // 일반
    NORMAL = "NORMAL", // 일반
    NOTICE = "NOTICE", // 공지사항
    EVENT = "EVENT", // 이벤트
}

export enum DetailedPostType {
    GENERAL = "GENERAL", // 일반
    QUESTION = "QUESTION", // 질문
    PHOTO = "PHOTO", // 사진
    SECRET = "SECRET", // 비밀
    PROMOTION = "PROMOTION", // 홍보
    RECRUIT = "RECRUIT", // 모집
    CRIME_SCENE = "CRIME_SCENE", // 크라임씬
    MURDER_MYSTERY = "MURDER_MYSTERY", // 머더미스터리
    ESCAPE_ROOM = "ESCAPE_ROOM", // 방탈출
    REAL_WORLD = "REAL_WORLD", // 리얼월드
    EVENT = "EVENT", // 이벤트
}

export enum BoardPostSortType {
    LATEST = "LATEST", // 최신순
    OLDEST = "OLDEST", // 오래된순
    VIEWS = "VIEWS", // 조회수
    LIKES = "LIKES", // 좋아요
}

// 게시글 인터페이스
export interface BoardPost {
    id: string;
    number?: number;
    subject: string; // 백엔드와 일치시킴
    title?: string; // 하위 호환성을 위해 유지
    content?: string;
    authorId?: string;
    authorName: string;
    authorProfileImagePath?: string;
    authorProfileImage?: string; // 백엔드 필드명
    boardType?: BoardType;
    postType?: PostType | DetailedPostType; // PostType과 DetailedPostType 모두 지원
    createdAt: string;
    updatedAt?: string;
    views: number; // viewCount 대신 views
    likes: number; // likeCount 대신 likes
    comments: number; // commentCount 대신 comments
    isSecret?: boolean;
    isPinned?: boolean;
    hasImage?: boolean;
    isOwnPost?: boolean; // 본인 글 여부
    isLikedByCurrentUser?: boolean; // 현재 사용자의 좋아요 여부
}

// 게시판 응답 페이지 인터페이스
export interface BoardPostPage {
    content: BoardPost[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            sorted: boolean;
            unsorted: boolean;
            empty: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number;
    number: number;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    numberOfElements: number;
    first: boolean;
    empty: boolean;
}
