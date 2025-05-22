import React, { useState, useEffect, useRef, useCallback } from "react";
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

            console.log('Loading posts:', { 
                searchQuery, 
                activeTab, 
                isSearching,
                currentPage,
                resetPage
            });

            if (isSearching) {
                console.log('Using search service for:', searchQuery);
                postsData = await searchService.searchPosts(searchQuery, currentPage, 12);
            } else if (activeTab === "popular") {
                console.log('Using explore service for popular posts');
                postsData = await exploreService.getPopularPosts(currentPage, 12);
            } else {
                console.log('Using explore service for random posts');
                postsData = await exploreService.getRandomPosts(currentPage, 12);
            }

            console.log('Posts data received:', postsData);

            if (resetPage || currentPage === 0) {
                setPosts(postsData.content || []);
                setPage(1);
            } else {
                setPosts(prev => [...prev, ...(postsData.content || [])]);
                setPage(prev => prev + 1);
            }

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
    };

    // 인기 해시태그 로딩
    const loadPopularHashtags = async () => {
        if (isSearching) return;
        
        try {
            console.log('Loading popular hashtags...');
            const hashtags = await searchService.getPopularHashtags();
            setPopularHashtags(hashtags?.content?.slice(0, 10) || []);
        } catch (error) {
            console.error("인기 해시태그 로드 실패:", error);
            setPopularHashtags([]);
        }
    };

    // URL 변경 감지 및 데이터 리로드 (핵심 로직)
    useEffect(() => {
        console.log('Key changed:', { prevKey: prevKey.current, currentKey });
        
        // 키가 변경되었을 때만 데이터 리로드
        if (prevKey.current !== currentKey) {
            prevKey.current = currentKey;
            
            // 상태 초기화
            setPosts([]);
            setPage(0);
            setHasMore(true);
            
            // 데이터 로드
            loadPosts(true);
            
            // 해시태그 로드 (검색 중이 아닐 때만)
            if (!isSearching) {
                loadPopularHashtags();
            } else {
                setPopularHashtags([]);
            }
        }
    }, [currentKey]); // currentKey만 의존성으로 사용

    // 무한 스크롤
    const lastPostElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    console.log('Loading more posts...');
                    loadPosts(false);
                }
            });

            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore] // loadPosts 제거로 무한 루프 방지
    );

    // 검색 처리
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const query = (formData.get('search') as string)?.trim();
        
        console.log('handleSearch called:', { query });
        
        if (query) {
            setSearchParams({ search: query });
        } else {
            setSearchParams({});
        }
    };

    // 검색 취소
    const handleClearSearch = () => {
        console.log('Clearing search');
        setSearchParams({});
    };

    // 해시태그 클릭
    const handleHashtagClick = (tag: string) => {
        const hashtagQuery = `#${tag}`;
        console.log('Hashtag clicked:', { tag, hashtagQuery });
        setSearchParams({ search: hashtagQuery });
    };

    // 탭 변경
    const handleTabChange = (tab: string) => {
        console.log('Tab change:', { tab });
        setSearchParams({ tab });
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
                        className="w-full px-3 py-2 border border-input rounded-md pr-20"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={handleClearSearch}
                        >
                            ✕
                        </button>
                    )}
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-muted-foreground hover:text-foreground"
                    >
                        🔍
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