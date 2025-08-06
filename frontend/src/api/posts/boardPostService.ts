import { apiClient } from "@/lib/api";
import {
    BoardPostPage,
    BoardType,
    PostType,
    DetailedPostType,
    BoardPostSortType,
} from "@/lib/types/board";

interface GetBoardPostsParams {
    page?: number;
    size?: number;
    kw?: string;
    boardType?: BoardType;
    postType?: PostType | DetailedPostType | null;
    sort?: BoardPostSortType[];
}

// API 예외 처리를 위한 헬퍼 함수
const handleApiError = (error: unknown) => {
    console.error("API 오류:", error);

    // 오류 로깅 및 실패 디버깅을 위한 추가 작업
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data: unknown }; request?: unknown; message?: string };
        // 서버가 응답을 보낸 경우
        if (axiosError.response) {
            console.error("HTTP 상태 코드:", axiosError.response.status);
            console.error("응답 데이터:", axiosError.response.data);
        }
    } else if (error && typeof error === 'object' && 'request' in error) {
        const axiosError = error as { request: unknown };
        // 요청은 보냈지만 응답이 없는 경우
        console.error("응답 없음:", axiosError.request);
    } else if (error instanceof Error) {
        // 요청 설정 중 오류가 발생한 경우
        console.error("오류 메시지:", error.message);
    }

    // 오류를 다시 호출자에게 전달
    throw error;
};

export const boardPostService = {
    // 게시글 목록 조회
    async getBoardPosts({
        page = 0,
        size = 20,
        kw = "",
        boardType = BoardType.NONE,
        postType = null,
        sort = [BoardPostSortType.LATEST],
    }: GetBoardPostsParams): Promise<BoardPostPage> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append("page", page.toString());
            searchParams.append("size", size.toString());
            if (kw) searchParams.append("kw", kw);
            if (boardType !== BoardType.NONE) searchParams.append("boardType", boardType);
            // postType이 null이 아닌 경우에만 파라미터 추가
            if (postType) searchParams.append("postType", postType);
            sort.forEach((sortOption) => {
                searchParams.append("sort", sortOption);
            });

            const query = searchParams.toString();
            return await apiClient.get<BoardPostPage>(
                `/public/posts${query ? "?" + query : ""}`
            );
        } catch (error) {
            return handleApiError(error);
        }
    },

    // 게시글 상세 조회
    async getBoardPostById(id: string) {
        try {
            return await apiClient.get(`/public/posts/${id}`);
        } catch (error) {
            return handleApiError(error);
        }
    },

    // 게시글 생성
    async createBoardPost(postData: {
        subject: string;
        content: string;
        boardType: BoardType;
        postType: string;
        isSecret: boolean;
        tempAudioIds?: string[];
    }) {
        try {
            return await apiClient.post("/posts", postData);
        } catch (error) {
            return handleApiError(error);
        }
    },

    // 게시글 수정 (추후 필요시 구현)
    async updateBoardPost(id: string, postData: {
        subject?: string;
        content?: string;
        boardType?: BoardType;
        postType?: string;
        isSecret?: boolean;
        tempAudioIds?: string[];
    }) {
        try {
            return await apiClient.put(`/posts/${id}`, postData);
        } catch (error) {
            return handleApiError(error);
        }
    },

    // 게시글 삭제 (추후 필요시 구현)
    async deleteBoardPost(id: string) {
        try {
            return await apiClient.delete(`/posts/${id}`);
        } catch (error) {
            return handleApiError(error);
        }
    },

    // 게시글 좋아요 토글
    async toggleLike(id: string) {
        try {
            return await apiClient.post(`/posts/${id}/like`);
        } catch (error) {
            return handleApiError(error);
        }
    },

    // 게시글 좋아요 상태 확인
    async getLikeStatus(id: string) {
        try {
            return await apiClient.get(`/posts/${id}/like`);
        } catch (error) {
            return handleApiError(error);
        }
    },

    // 게시글 네비게이션 조회 (이전글/다음글)
    async getPostNavigation(postId: string, boardType: BoardType) {
        try {
            return await apiClient.get(`/public/posts/${postId}/navigation?boardType=${boardType}`);
        } catch (error) {
            return handleApiError(error);
        }
    },
};
