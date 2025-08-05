import { BoardType, DetailedPostType } from "@/lib/types/board";

// 게시판 유형별 사용 가능한 게시글 유형 정의
export const BOARD_POST_TYPES: Record<BoardType, DetailedPostType[]> = {
    [BoardType.NONE]: [DetailedPostType.GENERAL],
    [BoardType.CHAT]: [
        DetailedPostType.GENERAL,
        DetailedPostType.PHOTO,
        DetailedPostType.EVENT,
        DetailedPostType.PROMOTION,
        DetailedPostType.RECRUIT,
        DetailedPostType.CRIME_SCENE,
        DetailedPostType.MURDER_MYSTERY,
        DetailedPostType.ESCAPE_ROOM,
        DetailedPostType.REAL_WORLD,
    ],
    [BoardType.QUESTION]: [
        DetailedPostType.QUESTION,
        DetailedPostType.GENERAL,
        DetailedPostType.EVENT,
    ],
    [BoardType.CREATOR]: [
        DetailedPostType.GENERAL,
        DetailedPostType.CRIME_SCENE,
        DetailedPostType.QUESTION,
        DetailedPostType.EVENT,
        DetailedPostType.MURDER_MYSTERY,
        DetailedPostType.ESCAPE_ROOM,
        DetailedPostType.REAL_WORLD,
        DetailedPostType.PROMOTION,
        DetailedPostType.RECRUIT,
    ],
};

export const POST_TYPE_LABELS: Record<string, string> = {
    [DetailedPostType.GENERAL]: "일반",
    [DetailedPostType.QUESTION]: "질문",
    [DetailedPostType.PHOTO]: "사진",
    [DetailedPostType.SECRET]: "비밀",
    [DetailedPostType.PROMOTION]: "홍보",
    [DetailedPostType.RECRUIT]: "모집",
    [DetailedPostType.CRIME_SCENE]: "크라임씬",
    [DetailedPostType.MURDER_MYSTERY]: "머더미스터리",
    [DetailedPostType.ESCAPE_ROOM]: "방탈출",
    [DetailedPostType.REAL_WORLD]: "리얼월드",
    [DetailedPostType.EVENT]: "이벤트",
};