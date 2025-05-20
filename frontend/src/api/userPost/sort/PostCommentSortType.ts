/**
 * 포스트 댓글 정렬 타입
 * 백엔드의 UserPostSortType.java 파일과 대응
 */
export enum PostCommentSortType {
  /** 최근 작성 순(기본) */
  LATEST = "LATEST",
  
  /** 오래된 순 */
  OLDEST = "OLDEST",
  
  /** 좋아요 많은 순 → 작성 시간 보조 */
  LIKES = "LIKES",
  
  /** 좋아요 적은 순 → 작성 시간 보조 */
  LIKES_ASC = "LIKES_ASC"
}

/**
 * 정렬 타입이 가지는 실제 정렬 정보
 * 백엔드와 달리 프론트에서는 참고용으로만 사용
 */
export interface SortInfo {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * 정렬 타입별 정렬 정보
 * 백엔드의 정렬 방식과 일치시키기 위한 참고용 정보
 */
export const SORT_INFO_MAP: Record<PostCommentSortType, SortInfo[]> = {
  [PostCommentSortType.LATEST]: [
    { field: "createdAt", direction: "desc" }
  ],
  [PostCommentSortType.OLDEST]: [
    { field: "createdAt", direction: "asc" }
  ],
  [PostCommentSortType.LIKES]: [
    { field: "likeCount", direction: "desc" },
    { field: "createdAt", direction: "desc" }
  ],
  [PostCommentSortType.LIKES_ASC]: [
    { field: "likeCount", direction: "asc" },
    { field: "createdAt", direction: "desc" }
  ]
};

/**
 * 기본 정렬 타입 반환
 */
export function getDefaultSortType(): PostCommentSortType {
  return PostCommentSortType.LATEST;
}

/**
 * 기본 정렬 타입 배열 반환
 */
export function getDefaultSortTypes(): PostCommentSortType[] {
  return [getDefaultSortType()];
}
