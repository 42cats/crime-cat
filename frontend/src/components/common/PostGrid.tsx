import React from "react";
import { UserPostGalleryDto } from "@/api/posts/postService";
import PostGridItem from "@/components/sns/common/PostGridItem";
import { Image, FileTextIcon } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface PostGridProps {
    posts: UserPostGalleryDto[];
    mode?: "modal" | "page"; // 모달 모드 또는 페이지 모드
    lastPostRef?: (node: HTMLElement | null) => void; // 무한 스크롤을 위한 IntersectionObserver ref
    onAuthorClick?: (authorId: string) => void; // 작성자 클릭 핸들러
    onPostClick?: (postId: string) => void; // 포스트 클릭 핸들러 (모달 모드용)
    userId?: string; // 프로필 모드에서 사용자 ID
    loading?: boolean; // 로딩 상태
    loadError?: {
        type: string;
        message: string;
    } | null; // 로드 에러 상태
}

const PostGrid: React.FC<PostGridProps> = ({
    posts,
    mode = "page",
    lastPostRef,
    onAuthorClick,
    onPostClick,
    userId,
    loading = false,
    loadError = null,
}) => {
    const { toast } = useToast();

    // 공유 기능
    const handleShare = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        try {
            const url = userId
                ? `${window.location.origin}/profile/${userId}/post/${postId}`
                : `${window.location.origin}/sns/post/${postId}`;
            await navigator.clipboard.writeText(url);
            toast({
                title: "링크 복사 완료",
                description: "포스트 링크가 복사되었습니다.",
            });
        } catch (error) {
            toast({
                title: "복사 실패",
                description: "브라우저 설정을 확인해주세요.",
                variant: "destructive",
            });
        }
    };

    // 포스트 클릭 핸들러
    const handlePostClick = (postId: string, e?: React.MouseEvent) => {
        if (mode === "modal" && onPostClick) {
            e?.preventDefault();
            onPostClick(postId);
        }
        // page 모드는 Link 컴포넌트가 자동으로 처리
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 min-h-[150px] md:min-h-[200px]">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="aspect-square bg-gray-100 animate-pulse rounded"
                    ></div>
                ))}
            </div>
        );
    }

    // 에러 상태
    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-md min-h-[150px] md:min-h-[200px]">
                <FileTextIcon size={40} className="mb-3" />
                <p className="text-sm font-medium mb-2">
                    {loadError.type === "not_found"
                        ? "포스트를 찾을 수 없습니다"
                        : "오류가 발생했습니다"}
                </p>
                <p className="text-xs text-gray-500">{loadError.message}</p>
            </div>
        );
    }

    // 빈 그리드 렌더링 (데이터 없는 경우)
    if (!posts || posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-md min-h-[150px] md:min-h-[200px]">
                <Image size={40} className="mb-3" />
                <p className="text-sm">등록된 포스트가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 min-h-[150px] md:min-h-[200px]">
            {posts.map((post, index) => {
                // 마지막 항목에 대한 ref 설정 (무한 스크롤)
                const isLastItem = index === posts.length - 1;

                return (
                    <div
                        key={post.postId}
                        ref={isLastItem && lastPostRef ? lastPostRef : null}
                        className="relative group"
                    >
                        <PostGridItem
                            post={post}
                            mode={mode}
                            userId={userId}
                            onAuthorClick={onAuthorClick}
                            onPostClick={onPostClick}
                            onShare={handleShare}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default PostGrid;
