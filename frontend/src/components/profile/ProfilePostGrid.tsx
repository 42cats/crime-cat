import React, { useState, useEffect } from "react";
import {
    userPostService,
    UserPostGalleryDto,
    UserPostDto,
} from '@/api/posts';
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import PostGrid from "@/components/common/PostGrid";
import PostDetailModal from "@/components/common/PostDetailModal";

interface ProfilePostGridProps {
    userId: string;
}

const ProfilePostGrid: React.FC<ProfilePostGridProps> = ({ userId }) => {
    const [posts, setPosts] = useState<UserPostGalleryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();

    // 포스트 갤러리 로드 실패시 표시할 오류 상태
    const [loadError, setLoadError] = useState<{
        type: string;
        message: string;
    } | null>(null);

    useEffect(() => {
        setLoading(true);
        setLoadError(null);

        userPostService
            .getUserPosts(userId)
            .then((data) => {
                console.log("포스트 데이터:", data);
                setPosts(data.content || []);
            })
            .catch((err) => {
                console.error("포스트 목록 로드 실패:", err);
                setPosts([]);

                // 오류 유형 파악
                if (err.response) {
                    if (err.response.status === 404) {
                        setLoadError({
                            type: "not_found",
                            message: "사용자의 포스트를 찾을 수 없습니다.",
                        });
                    } else {
                        setLoadError({
                            type: "server_error",
                            message: "서버 오류가 발생했습니다.",
                        });
                    }
                } else {
                    setLoadError({
                        type: "network_error",
                        message: "네트워크 연결을 확인해주세요.",
                    });
                }
            })
            .finally(() => setLoading(false));
    }, [userId]);

    // 좋아요 상태 변경 처리 함수
    const handleLikeStatusChange = (
        postId: string,
        liked: boolean,
        likeCount: number
    ) => {
        setPosts((prevPosts) => {
            return prevPosts.map((post) => {
                if (post.postId === postId) {
                    return {
                        ...post,
                        liked: liked,
                        likeCount: likeCount,
                    };
                }
                return post;
            });
        });
    };

    const handleOpenPostModal = (postId: string) => {
        setSelectedPostId(postId);
    };

    return (
        <>
            <PostGrid
                posts={posts}
                mode="modal"
                loading={loading}
                loadError={loadError}
                onPostClick={handleOpenPostModal}
                userId={userId}
            />

            {/* 포스트 상세 모달 */}
            {selectedPostId && (
                <PostDetailModal
                    postId={selectedPostId}
                    isOpen={!!selectedPostId}
                    onClose={() => setSelectedPostId(null)}
                    userId={userId}
                    onLikeStatusChange={handleLikeStatusChange}
                    mode="modal"
                />
            )}
        </>
    );
};

export default ProfilePostGrid;
