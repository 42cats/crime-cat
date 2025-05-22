import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import PostGrid from "@/components/sns/post/PostGrid";
import { exploreService } from "@/api/sns/exploreService";
import { searchService } from "@/api/sns/search";
import SnsBottomNavigation from '@/components/sns/SnsBottomNavigation';
import {
  SearchForm,
  PopularHashtags,
  SearchStatus,
  ExploreTabs,
  LoadingAndEmptyStates
} from '@/components/sns/explore';

const SNSExplorePage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("search") || "";
    const [activeTab, setActiveTab] = useState("popular");
    const [posts, setPosts] = useState<Array<any>>([]);
    const [popularHashtags, setPopularHashtags] = useState<Array<any>>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const [isSearching, setIsSearching] = useState(!!searchQuery);
    const observer = useRef<IntersectionObserver | null>(null);

    // 게시물 로드 함수 - 의존성 문제 해결
    const loadPosts = useCallback(
        async (resetPage = false) => {
            if (isLoading) return;
            
            // resetPage가 true가 아닌 경우에만 hasMore 체크
            if (!resetPage && !hasMore) return;

            const currentPage = resetPage ? 0 : page;
            const trimmedQuery = localSearchQuery.trim();
            const shouldSearch = trimmedQuery.length > 0 && isSearching;

            setIsLoading(true);
            try {
                let postsData;

                console.log('Loading posts:', { 
                    isSearching, 
                    localSearchQuery, 
                    trimmedQuery,
                    shouldSearch,
                    activeTab, 
                    currentPage,
                    resetPage
                });

                if (shouldSearch) {
                    // 통합 검색 (키워드 또는 해시태그)
                    console.log('Using search service for:', trimmedQuery);
                    postsData = await searchService.searchPosts(
                        trimmedQuery,
                        currentPage,
                        12
                    );
                } else if (activeTab === "popular") {
                    // 인기 게시물
                    console.log('Using explore service for popular posts');
                    postsData = await exploreService.getPopularPosts(
                        currentPage,
                        12
                    );
                } else {
                    // 무작위 게시물
                    console.log('Using explore service for random posts');
                    postsData = await exploreService.getRandomPosts(
                        currentPage,
                        12
                    );
                }

                console.log('Posts data received:', postsData);

                if (resetPage || currentPage === 0) {
                    setPosts(postsData.content || []);
                    setPage(1);
                } else {
                    setPosts((prevPosts) => [
                        ...prevPosts,
                        ...(postsData.content || []),
                    ]);
                    setPage(prev => prev + 1);
                }

                // 더 불러올 데이터가 있는지 확인
                setHasMore(!postsData.last && (postsData.content?.length || 0) > 0);

            } catch (error) {
                console.error("게시물 로드 실패:", error);
                if (resetPage) {
                    setPosts([]);
                    setHasMore(false);
                }
            } finally {
                setIsLoading(false);
            }
        },
        [activeTab, isSearching, localSearchQuery]
    );

    // 인기 해시태그 로드
    const loadPopularHashtags = useCallback(async () => {
        console.log('loadPopularHashtags called - isSearching:', isSearching);
        if (isSearching) {
            console.log('Skipping loadPopularHashtags because isSearching is true');
            return;
        }
        
        try {
            console.log('Actually loading popular hashtags...');
            const hashtags = await searchService.getPopularHashtags();
            if (hashtags == null || !hashtags.content) {
                setPopularHashtags([]);
                return;
            }
            setPopularHashtags(hashtags.content.slice(0, 10));
        } catch (error) {
            console.error("인기 해시태그 로드 실패:", error);
            setPopularHashtags([]);
        }
    }, [isSearching]);

    // URL 파라미터 변경 감지 및 상태 동기화
    useEffect(() => {
        const urlSearchQuery = searchParams.get("search") || "";
        console.log('URL params changed:', { urlSearchQuery, currentLocal: localSearchQuery });
        
        if (urlSearchQuery !== localSearchQuery) {
            console.log('Syncing state with URL params');
            setLocalSearchQuery(urlSearchQuery);
            const newIsSearching = !!urlSearchQuery;
            setIsSearching(newIsSearching);
            
            // 상태 초기화
            setPosts([]);
            setPage(0);
            setHasMore(true);
            
            console.log('State updated:', { urlSearchQuery, newIsSearching });
        }
    }, [searchParams, localSearchQuery]);

    // 첫 로드 및 탭/검색 상태 변경 시 데이터 로드
    useEffect(() => {
        console.log('Effect triggered for loadPosts:', { activeTab, isSearching, localSearchQuery });
        loadPosts(true);
    }, [loadPosts]);
    
    // 인기 해시태그는 검색 중이 아닐 때만 로드
    useEffect(() => {
        if (!isSearching) {
            loadPopularHashtags();
        } else {
            setPopularHashtags([]);
        }
    }, [loadPopularHashtags]);

    // 탭 변경 시 데이터 초기화
    const handleTabChange = (tab: string) => {
        console.log('Tab change:', { from: activeTab, to: tab });
        if (tab !== activeTab) {
            setActiveTab(tab);
            setPosts([]);
            setPage(0);
            setHasMore(true);
            
            // 탭 변경 시 검색 상태 클리어
            setIsSearching(false);
            setLocalSearchQuery("");
            setSearchParams({});
            console.log('Tab changed, search cleared');
        }
    };

    // 무한 스크롤 설정 - 개선된 버전
    const lastPostElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    console.log('Intersection detected, loading more posts...');
                    loadPosts(false);
                }
            });

            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore, loadPosts]
    );

    // 검색 처리
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedQuery = localSearchQuery.trim();
        console.log('handleSearch called:', { localSearchQuery, trimmedQuery });
        
        if (trimmedQuery) {
            console.log('Setting search params, other states will be updated by useEffect');
            setSearchParams({ search: trimmedQuery });
        } else {
            console.log('Empty search query, clearing search');
            setSearchParams({});
        }
    };

    // 검색 취소
    const handleClearSearch = () => {
        console.log('Clearing search');
        setLocalSearchQuery("");
        setSearchParams({});
    };

    // 검색어 입력 처리
    const handleSearchInputChange = useCallback((value: string) => {
        console.log('Search input changed:', value);
        setLocalSearchQuery(value);
    }, []);

    // 해시태그 클릭
    const handleHashtagClick = (tag: string) => {
        const hashtagQuery = `#${tag}`;
        console.log('Hashtag clicked:', { tag, hashtagQuery });
        
        setLocalSearchQuery(hashtagQuery);
        setSearchParams({ search: hashtagQuery });
    };

    return (
        <>
        <div className="container mx-auto px-4 py-6 mb-16 md:mb-0">
            <h1 className="text-2xl font-bold mb-6">탐색</h1>

            {/* 검색 폼 */}
            <SearchForm
                searchQuery={localSearchQuery}
                onSearchChange={handleSearchInputChange}
                onSubmit={handleSearch}
                onClear={handleClearSearch}
            />

            {/* 인기 해시태그 */}
            <PopularHashtags
                hashtags={popularHashtags}
                onHashtagClick={handleHashtagClick}
                isVisible={!isSearching}
            />

            {/* 검색 상태 표시 */}
            <SearchStatus
                isSearching={isSearching}
                searchQuery={localSearchQuery}
                onClearSearch={handleClearSearch}
            />

            {/* 탭 (검색 중이 아닐 때만 표시) */}
            <ExploreTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isVisible={!isSearching}
            />

            {/* 게시물 그리드 */}
            <PostGrid posts={posts} lastPostRef={lastPostElementRef} />

            {/* 로딩 및 빈 상태 */}
            <LoadingAndEmptyStates
                isLoading={isLoading}
                hasMore={hasMore}
                posts={posts}
                isSearching={isSearching}
            />
        </div>
        <SnsBottomNavigation />
        </>
    );
};

export default SNSExplorePage;