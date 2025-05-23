import React, { useState } from "react";
import { UserPostGalleryDto } from '@/api/posts';
import PostGrid from "@/components/common/PostGrid";
import PostDetailModal from "@/components/common/PostDetailModal";

interface SNSPostGridProps {
    posts: UserPostGalleryDto[];
    lastPostRef?: (node: HTMLElement | null) => void; // 무한 스크롤을 위한 IntersectionObserver ref
    onAuthorClick?: (authorId: string) => void; // 작성자 클릭 핸들러
}

const SNSPostGrid: React.FC<SNSPostGridProps> = ({
    posts,
    lastPostRef,
    onAuthorClick,
}) => {
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    const handleOpenPostModal = (postId: string) => {
        setSelectedPostId(postId);
    };

    return (
        <>
            <PostGrid
                posts={posts}
                mode="modal"
                lastPostRef={lastPostRef}
                onAuthorClick={onAuthorClick}
                onPostClick={handleOpenPostModal}
            />

            {/* 포스트 상세 모달 */}
            {selectedPostId && (
                <PostDetailModal
                    postId={selectedPostId}
                    isOpen={!!selectedPostId}
                    onClose={() => setSelectedPostId(null)}
                    mode="modal"
                />
            )}
        </>
    );
};

export default SNSPostGrid;
