import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth";
import { userPostService, UserPostGalleryDto } from "@/api/sns/post";
import PostGrid from "@/components/sns/post/PostGrid";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
import SnsBottomNavigation from "@/components/sns/SnsBottomNavigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SNSMyPostsPageContent: React.FC = () => {
    const { user } = useAuth();
    const observer = useRef<IntersectionObserver | null>(null);

    const [posts, setPosts] = useState<UserPostGalleryDto[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // 포스트 로딩
    const loadPosts = useCallback(
        async (resetPage = false, searchTerm = "") => {
            if (isLoading) return;
            if (!resetPage && !hasMore) return;

            const currentPage = resetPage ? 0 : page;

            setIsLoading(true);
            try {
                console.log("내 포스트 로딩:", {
                    currentPage,
                    resetPage,
                    searchTerm: searchTerm || searchQuery,
                });

                const postsData = await userPostService.getMyPosts(
                    currentPage,
                    12,
                    searchTerm || searchQuery || undefined
                );

                console.log("내 포스트 데이터:", postsData);

                if (resetPage || currentPage === 0) {
                    setPosts(postsData.content || []);
                    setPage(1);
                } else {
                    setPosts((prev) => [...prev, ...(postsData.content || [])]);
                    setPage((prev) => prev + 1);
                }

                setHasMore(
                    !postsData.last && (postsData.content?.length || 0) > 0
                );
            } catch (error) {
                console.error("내 포스트 로드 실패:", error);
                if (resetPage) {
                    setPosts([]);
                    setHasMore(false);
                }
            } finally {
                setIsLoading(false);
            }
        },
        [page, hasMore, isLoading, searchQuery]
    );

    // 초기 로드
    useEffect(() => {
        loadPosts(true);
    }, []);

    // 검색 처리
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const query = inputValue.trim();

        console.log("검색 실행:", { query });

        setSearchQuery(query);
        setIsSearching(!!query);

        // 상태 초기화
        setPosts([]);
        setPage(0);
        setHasMore(true);

        // 검색 실행
        loadPosts(true, query);
    };

    // 검색 취소
    const handleClearSearch = () => {
        console.log("검색 취소");
        setInputValue("");
        setSearchQuery("");
        setIsSearching(false);

        // 상태 초기화
        setPosts([]);
        setPage(0);
        setHasMore(true);

        // 전체 포스트 다시 로드
        loadPosts(true, "");
    };

    // 무한 스크롤
    const lastPostElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    console.log("더 많은 포스트 로딩...");
                    loadPosts(false);
                }
            });

            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore, loadPosts]
    );

    // 프로필 모달 열기
    const handleAuthorClick = (authorId: string) => {
        setSelectedUserId(authorId);
        setIsProfileModalOpen(true);
    };

    return (
        <>
            <div className="container mx-auto px-4 py-6 mb-16 md:mb-0">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">내 게시물</h1>
                    <div className="text-sm text-muted-foreground">
                        총 {posts.length}개
                    </div>
                </div>

                {/* 검색 폼 */}
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="내 게시물 검색..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="pr-20"
                        />
                        {inputValue && (
                            <button
                                type="button"
                                onClick={() => setInputValue("")}
                                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <Button
                            type="submit"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        >
                            검색
                        </Button>
                    </div>
                </form>

                {/* 검색 상태 표시 */}
                {isSearching && (
                    <div className="flex items-center justify-between mb-6 p-3 bg-muted rounded-lg">
                        <div className="flex items-center">
                            <Search className="h-4 w-4 mr-2" />
                            <span className="text-sm">
                                <strong>"{searchQuery}"</strong>로 검색한 결과
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearSearch}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            검색 취소
                        </Button>
                    </div>
                )}

                {/* 게시물 그리드 */}
                <PostGrid
                    posts={posts}
                    lastPostRef={lastPostElementRef}
                    onAuthorClick={handleAuthorClick}
                />

                {/* 로딩 상태 */}
                {isLoading && (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}

                {/* 빈 상태 */}
                {!isLoading && posts.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-muted-foreground">
                            {isSearching ? (
                                <>
                                    <p className="text-lg font-medium mb-2">
                                        검색 결과가 없습니다
                                    </p>
                                    <p className="text-sm">
                                        다른 검색어로 시도해보세요
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg font-medium mb-2">
                                        아직 작성한 게시물이 없습니다
                                    </p>
                                    <p className="text-sm">
                                        첫 번째 게시물을 작성해보세요!
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* 더 이상 로드할 게시물이 없음 */}
                {!isLoading && !hasMore && posts.length > 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">모든 게시물을 확인했습니다</p>
                    </div>
                )}

                {/* 프로필 모달 */}
                {selectedUserId && (
                    <ProfileDetailModal
                        userId={selectedUserId}
                        open={isProfileModalOpen}
                        onOpenChange={setIsProfileModalOpen}
                    />
                )}
            </div>
            <SnsBottomNavigation />
        </>
    );
};

const SNSMyPostsPage: React.FC = () => {
    return (
        <AuthGuard>
            <SNSMyPostsPageContent />
        </AuthGuard>
    );
};

export default SNSMyPostsPage;
