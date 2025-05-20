import React, { useState, useEffect } from "react";
import {
    userPostService,
    UserPostGalleryDto,
    UserPostDto,
} from "@/api/userPost/userPostService";
import { FileTextIcon, Heart, MessageSquare, Share2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import PostDetailModal from "./PostDetailModal";

interface ProfilePostGridProps {
    userId: string;
}

const ProfilePostGrid: React.FC<ProfilePostGridProps> = ({ userId }) => {
    const [posts, setPosts] = useState<UserPostGalleryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<UserPostDto | null>(null);
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();

    // 선택된 포스트 ID 저장
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

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

    // 포스트 상세 정보 로드
    useEffect(() => {
        if (selectedPostId) {
            const fetchPostDetail = async () => {
                try {
                    const data = await userPostService.getUserPostDetail(
                        selectedPostId
                    );
                    setSelectedPost(data);
                } catch (err) {
                    console.error("포스트 상세 정보 로드 실패:", err);
                    toast({
                        title: "포스트 로드 실패",
                        description: "포스트 정보를 불러올 수 없습니다.",
                        variant: "destructive",
                    });
                    setSelectedPostId(null);
                }
            };

            fetchPostDetail();
        }
    }, [selectedPostId, toast]);

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-[150px] md:min-h-[200px]">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="aspect-square bg-gray-100 animate-pulse rounded"
                    ></div>
                ))}
            </div>
        );
    }

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

    if (!posts.length) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-md min-h-[150px] md:min-h-[200px]">
                <FileTextIcon size={40} className="mb-3" />
                <p className="text-sm">등록된 포스트가 없습니다.</p>
            </div>
        );
    }

    const handleOpenPostModal = (postId: string) => {
        setSelectedPostId(postId);
    };

    const handleShare = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // 이벤트 버블링 방지

        try {
            const url = `${window.location.origin}/profile/${userId}/post/${postId}`;
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

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 min-h-[150px] md:min-h-[200px]">
                {posts.map((post) => (
                    <div
                        key={post.postId}
                        className="relative bg-gray-100 overflow-hidden group cursor-pointer rounded-md shadow-sm hover:shadow-md transition-shadow"
                        onClick={() => handleOpenPostModal(post.postId)}
                    >
                        {post.thumbnailUrl ? (
                            // 이미지가 있는 경우
                            <div className="aspect-square overflow-hidden">
                                <img
                                    src={post.thumbnailUrl}
                                    alt={`${post.authorNickname}의 포스트`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Heart
                                                size={16}
                                                className={
                                                    post.liked
                                                        ? "text-red-500"
                                                        : "text-gray-300"
                                                }
                                            />
                                            <span className="text-xs">
                                                {post.likeCount}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) =>
                                                handleShare(post.postId, e)
                                            }
                                            className="text-gray-300 hover:text-white transition-colors"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // 이미지가 없는 경우 텍스트 형태로 표시
                            <div className="aspect-square p-3 flex flex-col justify-between">
                                <div className="line-clamp-6 text-sm font-medium">
                                    {/* API에서 포스트 내용을 미리 제공하지 않으므로 실제 구현 시 API 수정 필요 */}
                                    <span className="text-gray-500">
                                        {post.content.slice(0, 50)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center space-x-2">
                                        <Heart
                                            size={16}
                                            className={
                                                post.liked
                                                    ? "text-red-500"
                                                    : "text-gray-500"
                                            }
                                        />
                                        <span className="text-xs">
                                            {post.likeCount}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) =>
                                            handleShare(post.postId, e)
                                        }
                                        className="text-gray-500 hover:text-blue-500 transition-colors"
                                    >
                                        <Share2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 포스트 상세 모달 */}
            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    isOpen={!!selectedPost}
                    onClose={() => {
                        setSelectedPost(null);
                        setSelectedPostId(null);
                    }}
                    userId={userId}
                />
            )}
        </>
    );
};

export default ProfilePostGrid;
