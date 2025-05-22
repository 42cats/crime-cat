import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import PostCard from "@/components/sns/post/PostCard";
import { exploreService } from "@/api/explore/exploreService";
import { UserPostDto } from "@/api/posts";
import SnsBottomNavigation from "@/components/sns/SnsBottomNavigation";
import PostDetailModal from "@/components/common/PostDetailModal";
const SNSFeedPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [posts, setPosts] = useState<UserPostDto[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);
    
    // 모달 상태
    const [selectedPost, setSelectedPost] = useState<UserPostDto | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 피드 게시물 로드
    const loadFeedPosts = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const feedData = await exploreService.getFeedPosts(page);
            const newPosts = feedData.content.map((post) => ({
                postId: post.postId.toString(),
                authorId: post.authorId || "", // authorId 추가
                authorNickname: post.authorNickname,
                authorAvatarUrl: "", // 백엔드에서 제공되지 않는 정보
                content: post.content,
                imageUrls: post.thumbnailUrl ? [post.thumbnailUrl] : [],
                likeCount: post.likeCount,
                liked: post.liked,
                createdAt: post.createdAt || new Date().toISOString(),
                updatedAt: post.updatedAt, // updatedAt 추가
                private: post.private || false, // private 속성 추가
                followersOnly: post.followersOnly || false, // followersOnly 속성 추가
                hashtags: post.hashtags || [], // hashtags 추가
                locationName: post.locationName || "", // locationName 추가
                latitude: post.latitude, // latitude 추가
                longitude: post.longitude, // longitude 추가
                comments: [], // comments 배열 초기화
            }));

            if (page === 0) {
                setPosts(newPosts);
            } else {
                setPosts((prevPosts) => [...prevPosts, ...newPosts]);
            }

            // 더 불러올 데이터가 있는지 확인
            setHasMore(
                !feedData.pageable ||
                    feedData.pageable.pageNumber < feedData.totalPages - 1
            );
            setPage((prev) => prev + 1);
        } catch (error) {
            console.error("피드 로드 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, isLoading, hasMore]);

    // 첫 로드
    useEffect(() => {
        if (isAuthenticated) {
            loadFeedPosts();
        } else {
            // 로그인되지 않은 경우 인기 게시물을 대신 표시
            const loadPopularPosts = async () => {
                setIsLoading(true);
                try {
                    const popularData = await exploreService.getPopularPosts(0);
                    const popularPosts = popularData.content.map((post) => ({
                        postId: post.postId.toString(),
                        authorId: post.authorId || "", // authorId 추가
                        authorNickname: post.authorNickname,
                        authorAvatarUrl: "", // 백엔드에서 제공되지 않는 정보
                        content: post.content,
                        imageUrls: post.thumbnailUrl ? [post.thumbnailUrl] : [],
                        likeCount: post.likeCount,
                        liked: post.liked,
                        createdAt: post.createdAt || new Date().toISOString(),
                        updatedAt: post.updatedAt, // updatedAt 추가
                        private: post.private || false, // private 속성 추가
                        followersOnly: post.followersOnly || false, // followersOnly 속성 추가
                        hashtags: post.hashtags || [], // hashtags 추가
                        locationName: post.locationName || "", // locationName 추가
                        latitude: post.latitude, // latitude 추가
                        longitude: post.longitude, // longitude 추가
                        comments: [], // comments 배열 초기화
                    }));

                    setPosts(popularPosts);
                    setHasMore(false); // 로그인 전에는 무한 스크롤 비활성화
                } catch (error) {
                    console.error("인기 게시물 로드 실패:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            loadPopularPosts();
        }
    }, [isAuthenticated]);

    // 무한 스크롤 설정
    const lastPostElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadFeedPosts();
                }
            });

            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore, loadFeedPosts]
    );

    // 좋아요 변경 시 상태 업데이트
    const handleLikeChange = (postId: string, liked: boolean) => {
        setPosts((prevPosts) =>
            prevPosts.map((post) =>
                post.postId === postId
                    ? {
                          ...post,
                          liked,
                          likeCount: liked
                              ? post.likeCount + 1
                              : post.likeCount - 1,
                      }
                    : post
            )
        );
    };

    // 포스트 클릭 핸들러
    const handlePostClick = (post: UserPostDto) => {
        setSelectedPost(post);
        setIsModalOpen(true);
    };

    // 모달 닫기 핸들러
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedPost(null);
    };

    // 모달에서 좋아요 상태 변경 시 업데이트
    const handleModalLikeChange = (postId: string, liked: boolean, likeCount: number) => {
        setPosts((prevPosts) =>
            prevPosts.map((post) =>
                post.postId === postId
                    ? { ...post, liked, likeCount }
                    : post
            )
        );
    };

    return (
        <>
            <div className="container mx-auto px-4 py-6 max-w-lg mb-16 md:mb-0">
                <h1 className="text-2xl font-bold mb-6">SNS 피드</h1>

                {!isAuthenticated && (
                    <div className="bg-card p-4 rounded-md mb-6 text-center">
                        <p className="text-muted-foreground mb-2">
                            로그인하여 맞춤 피드를 확인하세요.
                        </p>
                        <p className="text-sm">
                            현재 인기 게시물을 표시하고 있습니다.
                        </p>
                    </div>
                )}

                <div className="space-y-6">
                    {posts.map((post, index) => {
                        if (posts.length === index + 1) {
                            return (
                                <div key={post.postId} ref={lastPostElementRef}>
                                    <PostCard
                                        post={post}
                                        onLikeChange={handleLikeChange}
                                        onPostClick={handlePostClick}
                                    />
                                </div>
                            );
                        } else {
                            return (
                                <PostCard
                                    key={post.postId}
                                    post={post}
                                    onLikeChange={handleLikeChange}
                                    onPostClick={handlePostClick}
                                />
                            );
                        }
                    })}

                    {isLoading && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    {!hasMore && posts.length > 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                            모든 게시물을 불러왔습니다.
                        </div>
                    )}

                    {!isLoading && posts.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg mb-2">
                                표시할 게시물이 없습니다.
                            </p>
                            <p className="text-sm">
                                게시물을 작성하거나 다른 사용자를 팔로우하세요.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <SnsBottomNavigation />
            
            {/* 포스트 상세 모달 */}
            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    userId={selectedPost.authorId}
                    onLikeStatusChange={handleModalLikeChange}
                />
            )}
        </>
    );
};

export default SNSFeedPage;
