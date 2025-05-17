import { apiClient } from "@/lib/api";
import {
    BoardPostPage,
    BoardType,
    PostType,
    BoardPostSortType,
} from "@/lib/types/board";

interface GetBoardPostsParams {
    page?: number;
    size?: number;
    kw?: string;
    boardType?: BoardType;
    postType?: PostType;
    sort?: BoardPostSortType[];
}

// API 예외 처리를 위한 헬퍼 함수
const handleApiError = (error: any) => {
    console.error("API 오류:", error);

    // 오류 로깅 및 실패 디버깅을 위한 추가 작업
    if (error.response) {
        // 서버가 응답을 보낸 경우
        console.error("HTTP 상태 코드:", error.response.status);
        console.error("응답 데이터:", error.response.data);
    } else if (error.request) {
        // 요청은 보냈지만 응답이 없는 경우
        console.error("응답 없음:", error.request);
    } else {
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
        postType = PostType.NONE,
        sort = [BoardPostSortType.LATEST],
    }: GetBoardPostsParams): Promise<BoardPostPage> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append("page", page.toString());
            searchParams.append("size", size.toString());
            if (kw) searchParams.append("kw", kw);
            searchParams.append("boardType", boardType);
            searchParams.append("postType", postType);
            sort.forEach((sortOption) => {
                searchParams.append("sort", sortOption);
            });

            const query = searchParams.toString();
            return await apiClient.get<BoardPostPage>(
                `/posts${query ? "?" + query : ""}`
            );
        } catch (error) {
            return handleApiError(error);
        }
    },

    // 게시글 상세 조회 (추후 필요시 구현)
    async getBoardPostById(id: string) {
        try {
            return await apiClient.get(`/posts/${id}`);
        } catch (error) {
            return handleApiError(error);
        }
    },

    // 게시글 생성 (추후 필요시 구현)
    async createBoardPost(postData: any) {
        try {
            return await apiClient.post("/posts", postData);
        } catch (error) {
            return handleApiError(error);
        }
    },

    // 게시글 수정 (추후 필요시 구현)
    async updateBoardPost(id: string, postData: any) {
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
};
