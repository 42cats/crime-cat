import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PostGrid from "@/components/sns/post/PostGrid";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
import { exploreService } from "@/api/explore/exploreService";
import { searchService } from "@/api/search/searchService";
import SnsBottomNavigation from "@/components/sns/SnsBottomNavigation";
import {
    PopularHashtags,
    SearchStatus,
    ExploreTabs,
    LoadingAndEmptyStates,
} from "@/components/sns/explore";

const SNSExplorePage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const observer = useRef<IntersectionObserver | null>(null);

    // URL에서 파생된 상태 (Single Source of Truth)
    const searchQuery = searchParams.get("search") || "";
    const activeTab = searchParams.get("tab") || "popular";
    const isSearching = !!searchQuery;

    // 데이터 상태 (최소한으로 유지)
    const [posts, setPosts] = useState<Array<any>>([]);
    const [popularHashtags, setPopularHashtags] = useState<Array<any>>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // 이전 검색 키를 추적하여 데이터 초기화 시점 결정
    const prevKey = useRef<string>("");
    const currentKey = `${searchQuery}:${activeTab}`;

    // 데이터 로딩 함수 (useCallback 제거로 의존성 문제 해결)
    const loadPosts = async (resetPage = false) => {
        if (isLoading) return;
        if (!resetPage && !hasMore) return;

        const currentPage = resetPage ? 0 : page;

        setIsLoading(true);
        try {
            let postsData;

            if (isSearching) {
                postsData = await searchService.searchPosts(
                    searchQuery,
                    currentPage,
                    12
                );
            } else if (activeTab === "popular") {
                postsData = await exploreService.getPopularPosts(
                    currentPage,
                    12
                );
            } else {
                postsData = await exploreService.getRandomPosts(
                    currentPage,
                    12
                );
            }

            if (resetPage || currentPage === 0) {
                setPosts(postsData.content || []);
                setPage(1);
            } else {
                setPosts((prev) => [...prev, ...(postsData.content || [])]);
                setPage((prev) => prev + 1);
            }

            setHasMore(!postsData.last && (postsData.content?.length || 0) > 0);
        } catch (error) {
            if (resetPage) {
                setPosts([]);
                setHasMore(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 인기 해시태그 로딩
    const loadPopularHashtags = async () => {
        if (isSearching) return;

        try {
            console.log("Loading popular hashtags...");
            const hashtags = await searchService.getPopularHashtags();
            setPopularHashtags(hashtags?.content?.slice(0, 10) || []);
        } catch (error) {
            console.error("인기 해시태그 로드 실패:", error);
            setPopularHashtags([]);
        }
    };

    // URL 변경 감지 및 데이터 리로드 (핵심 로직)
    useEffect(() => {
        let mounted = true;
        let loadingTimeout: NodeJS.Timeout | null = null;

        // 키가 변경되었을 때만 데이터 리로드
        if (prevKey.current !== currentKey) {
            prevKey.current = currentKey;

            // 상태 초기화
            setPosts([]);
            setPage(0);
            setHasMore(true);

            // 약간의 딜레이를 주어 중복 호출 방지
            loadingTimeout = setTimeout(() => {
                if (mounted) {
                    // 데이터 로드
                    loadPosts(true);

                    // 해시태그 로드 (검색 중이 아닐 때만)
                    if (!isSearching) {
                        loadPopularHashtags();
                    } else {
                        setPopularHashtags([]);
                    }
                }
            }, 50);
        }

        return () => {
            mounted = false;
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
            }
        };
    }, [currentKey]); // currentKey만 의존성으로 사용

    // 무한 스크롤
    const lastPostElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore && !isLoading) {
                        loadPosts(false);
                    }
                },
                {
                    rootMargin: "100px",
                    threshold: 0.1,
                }
            );

            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore] // loadPosts 제거로 무한 루프 방지
    );

    // 검색 처리
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const query = (formData.get("search") as string)?.trim();

        if (query) {
            setSearchParams({ search: query });
        } else {
            setSearchParams({});
        }
    };

    // 검색 취소
    const handleClearSearch = () => {
        setSearchParams({});
    };

    // 해시태그 클릭
    const handleHashtagClick = (tag: string) => {
        const hashtagQuery = `#${tag}`;
        setSearchParams({ search: hashtagQuery });
    };

    // 탭 변경
    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
    };

    // 프로필 모달 열기
    const handleAuthorClick = (authorId: string) => {
        setSelectedUserId(authorId);
        setIsProfileModalOpen(true);
    };

    return (
        <>
            <div className="container mx-auto px-4 py-6 mb-16 md:mb-0">
                <h1 className="text-2xl font-bold mb-6">탐색</h1>

                {/* 검색 폼 - 단순한 form 사용 */}
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                        <input
                            name="search"
                            type="text"
                            placeholder="검색 또는 #해시태그 검색..."
                            key={searchQuery} // key로 리렌더링 강제하여 defaultValue 업데이트
                            defaultValue={searchQuery}
                            className="w-full px-3 py-2 border border-input rounded-md pr-24"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="absolute right-20 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={handleClearSearch}
                            >
                                ✕
                            </button>
                        )}
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                        >
                            검색
                        </button>
                    </div>
                </form>

                {/* 인기 해시태그 */}
                <PopularHashtags
                    hashtags={popularHashtags}
                    onHashtagClick={handleHashtagClick}
                    isVisible={!isSearching}
                />

                {/* 검색 상태 표시 */}
                <SearchStatus
                    isSearching={isSearching}
                    searchQuery={searchQuery}
                    onClearSearch={handleClearSearch}
                />

                {/* 탭 (검색 중이 아닐 때만 표시) */}
                <ExploreTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    isVisible={!isSearching}
                />

                {/* 게시물 그리드 */}
                <PostGrid
                    posts={posts}
                    lastPostRef={lastPostElementRef}
                    onAuthorClick={handleAuthorClick}
                />

                {/* 로딩 및 빈 상태 */}
                <LoadingAndEmptyStates
                    isLoading={isLoading}
                    hasMore={hasMore}
                    posts={posts}
                    isSearching={isSearching}
                />

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

export default SNSExplorePage;
