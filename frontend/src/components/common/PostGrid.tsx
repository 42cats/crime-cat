import React, { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { UserPostGalleryDto } from "@/api/sns/post";
import LazyImage from "@/components/sns/common/LazyImage";
import PostPrivacyBadge from "@/components/sns/common/PostPrivacyBadge";
import PostAuthorInfo from "@/components/sns/common/PostAuthorInfo";
import {
    Heart,
    MessageCircle,
    Image,
    FileTextIcon,
    Share2,
} from "lucide-react";
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

                const PostWrapper = mode === "page" ? Link : "div";
                const wrapperProps =
                    mode === "page"
                        ? { to: `/sns/post/${post.postId}` }
                        : {
                              onClick: (e: React.MouseEvent) =>
                                  handlePostClick(post.postId, e),
                              style: { cursor: "pointer" },
                          };

                return (
                    <div
                        key={post.postId}
                        ref={isLastItem && lastPostRef ? lastPostRef : null}
                        className="relative group"
                    >
                        <PostWrapper {...wrapperProps}>
                            <div className="relative bg-gray-100 overflow-hidden group cursor-pointer rounded-md shadow-sm hover:shadow-md transition-shadow">
                                {post.thumbnailUrl ? (
                                    // 이미지가 있는 경우
                                    <div className="aspect-square overflow-hidden relative">
                                        <LazyImage
                                            src={post.thumbnailUrl}
                                            alt={`${post.authorNickname}의 게시물`}
                                            aspectRatio="square"
                                            className="rounded-sm w-full h-full object-cover"
                                        />

                                        {/* 프라이버시 배지 */}
                                        <div className="absolute top-2 left-2">
                                            <PostPrivacyBadge
                                                isPrivate={post.private}
                                                isFollowersOnly={
                                                    post.followersOnly
                                                }
                                                size="sm"
                                            />
                                        </div>

                                        {/* 하단 정보 오버레이 */}
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Heart
                                                        size={16}
                                                        className={
                                                            post.liked
                                                                ? "text-red-500 fill-red-500"
                                                                : "text-gray-300"
                                                        }
                                                    />
                                                    <span className="text-xs">
                                                        {post.likeCount}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) =>
                                                        handleShare(
                                                            post.postId,
                                                            e
                                                        )
                                                    }
                                                    className="text-gray-300 hover:text-white transition-colors"
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                            </div>

                                            {/* 작성자 정보 (SNS 모드에서만) */}
                                            {!userId && (
                                                <div className="mt-1">
                                                    <PostAuthorInfo
                                                        authorNickname={
                                                            post.authorNickname
                                                        }
                                                        authorId={post.authorId}
                                                        createdAt={
                                                            post.createdAt
                                                        }
                                                        locationName={
                                                            post.locationName
                                                        }
                                                        onAuthorClick={
                                                            onAuthorClick
                                                        }
                                                        showAvatar={false}
                                                        size="sm"
                                                        className="text-white [&_.text-muted-foreground]:text-gray-300"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    // 이미지가 없는 경우 텍스트 형태로 표시
                                    <div className="aspect-square p-3 flex flex-col justify-between relative">
                                        {/* 프라이버시 배지 */}
                                        <div className="absolute top-2 left-2 z-10">
                                            <PostPrivacyBadge
                                                isPrivate={post.private}
                                                isFollowersOnly={
                                                    post.followersOnly
                                                }
                                                size="sm"
                                            />
                                        </div>

                                        <div className="line-clamp-4 text-sm font-medium mt-6 leading-relaxed">
                                            <span className="text-gray-800">
                                                {post.content.slice(0, 100)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center space-x-2">
                                                <Heart
                                                    size={16}
                                                    className={
                                                        post.liked
                                                            ? "text-red-500 fill-red-500"
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

                                        {/* 작성자 정보 (SNS 모드에서만) */}
                                        {!userId && (
                                            <div className="mt-2">
                                                <PostAuthorInfo
                                                    authorNickname={
                                                        post.authorNickname
                                                    }
                                                    authorId={post.authorId}
                                                    createdAt={post.createdAt}
                                                    locationName={
                                                        post.locationName
                                                    }
                                                    onAuthorClick={
                                                        onAuthorClick
                                                    }
                                                    showAvatar={false}
                                                    size="sm"
                                                    className="text-gray-600"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 호버 오버레이 (SNS 모드에서만) */}
                                {!userId && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center">
                                                <Heart className="w-5 h-5 mr-2" />
                                                <span>{post.likeCount}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <MessageCircle className="w-5 h-5 mr-2" />
                                                <span>0</span>{" "}
                                                {/* 댓글 수가 없으므로 임시로 0 */}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </PostWrapper>
                    </div>
                );
            })}
        </div>
    );
};

export default PostGrid;
