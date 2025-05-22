    // 검색어 입력 처리 - 디바운스로 성능 최적화
    const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        console.log('Search input changed:', value);
        setLocalSearchQuery(value);
    }, []);import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import PostGrid from "@/components/sns/post/PostGrid";
import { exploreService } from "@/api/sns/exploreService";
import { searchService } from "@/api/search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

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

    // 게시물 로드
    const loadPosts = useCallback(
        async (resetPage = false) => {
            if (isLoading || (!hasMore && !resetPage)) return;

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
                    currentPage 
                });

                if (shouldSearch) {
                    // 통합 검색 (키워드 또는 해시태그)
                    console.log('Using search service for:', trimmedQuery);
                    postsData = await searchService.searchPosts(
                        trimmedQuery,
                        currentPage
                    );
                } else if (activeTab === "popular") {
                    // 인기 게시물
                    console.log('Using explore service for popular posts');
                    postsData = await exploreService.getPopularPosts(
                        currentPage
                    );
                } else {
                    // 무작위 게시물
                    console.log('Using explore service for random posts');
                    postsData = await exploreService.getRandomPosts(
                        currentPage
                    );
                }

                console.log('Posts data received:', postsData);

                if (resetPage || currentPage === 0) {
                    setPosts(postsData.content);
                } else {
                    setPosts((prevPosts) => [
                        ...prevPosts,
                        ...postsData.content,
                    ]);
                }

                // 더 불러올 데이터가 있는지 확인
                setHasMore(!postsData.last && postsData.content.length > 0);

                if (resetPage) {
                    setPage(1);
                } else {
                    setPage((prev) => prev + 1);
                }
            } catch (error) {
                console.error("게시물 로드 실패:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [activeTab, page, hasMore, isSearching, localSearchQuery] // isLoading 제거
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
                setPopularHashtags([]); // 상위 10개만 표시
                return;
            }
            setPopularHashtags(hashtags.content.slice(0, 10)); // 상위 10개만 표시
        } catch (error) {
            console.error("인기 해시태그 로드 실패:", error);
            setPopularHashtags([]);
        }
    }, [isSearching]);

    // URL 파라미터 변경 감지 및 상태 동기화
    useEffect(() => {
        const urlSearchQuery = searchParams.get("search") || "";
        console.log('URL params changed:', { urlSearchQuery, currentLocal: localSearchQuery });
        
        // 무한 루프 방지: URL에서 온 값과 현재 값이 다를 때만 업데이트
        if (urlSearchQuery !== localSearchQuery) {
            console.log('Syncing state with URL params');
            setLocalSearchQuery(urlSearchQuery);
            const newIsSearching = !!urlSearchQuery;
            setIsSearching(newIsSearching);
            setPosts([]);
            setPage(0);
            setHasMore(true);
            
            console.log('State updated:', { urlSearchQuery, newIsSearching });
        }
    }, [searchParams]); // localSearchQuery 제거로 무한 루프 방지

    // 첫 로드 및 탭/검색 상태 변경 시 데이터 로드
    useEffect(() => {
        console.log('Effect triggered:', { activeTab, isSearching, localSearchQuery });
        loadPosts(true);
    }, [activeTab, isSearching, localSearchQuery]);
    
    // 인기 해시태그는 검색 중이 아닐 때만 로드
    useEffect(() => {
        if (!isSearching) {
            loadPopularHashtags();
        }
    }, [isSearching]);

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

    // 무한 스크롤 설정
    const lastPostElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (isLoading || !hasMore) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadPosts();
                }
            });

            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore, loadPosts]
    );

    // 검색 처리 - 단순화하여 상태 충돌 방지
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedQuery = localSearchQuery.trim();
        console.log('handleSearch called:', { localSearchQuery, trimmedQuery });
        
        if (trimmedQuery) {
            console.log('Setting search params, other states will be updated by useEffect');
            // URL 파라미터만 업데이트, 나머지는 useEffect에서 처리
            setSearchParams({ search: trimmedQuery });
        } else {
            console.log('Empty search query, clearing search');
            setSearchParams({});
        }
    };

    // 검색 취소 - 단순화
    const handleClearSearch = () => {
        console.log('Clearing search');
        setLocalSearchQuery("");
        setSearchParams({}); // URL 클리어만 하고 나머지는 useEffect에서 처리
    };

    // 검색어 입력 처리 - 디바운스로 성능 최적화
    const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        console.log('Search input changed:', value);
        setLocalSearchQuery(value);
    }, []);

    // 해시태그 클릭 - 단순화
    const handleHashtagClick = (tag: string) => {
        const hashtagQuery = `#${tag}`;
        console.log('Hashtag clicked:', { tag, hashtagQuery });
        
        setLocalSearchQuery(hashtagQuery);
        setSearchParams({ search: hashtagQuery }); // URL 업데이트만 하고 나머지는 useEffect에서 처리
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">탐색</h1>

            {/* 검색 폼 */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                    <Input
                        type="text"
                        placeholder="검색 또는 #해시태그 검색..."
                        value={localSearchQuery}
                        onChange={handleSearchInputChange}
                        className="pr-10"
                    />
                    {localSearchQuery ? (
                        <button
                            type="button"
                            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={handleClearSearch}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : null}
                    <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="absolute right-0 top-0 h-full"
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                </div>
            </form>

            {/* 인기 해시태그 */}
            {!isSearching && popularHashtags.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-medium text-muted-foreground mb-2">
                        인기 해시태그
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {popularHashtags.map((tag) => (
                            <Button
                                key={tag.id}
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => handleHashtagClick(tag.name)}
                            >
                                #{tag.name}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* 검색 중인 경우 정보 표시 */}
            {isSearching && (
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm">
                        <span className="font-medium">{localSearchQuery}</span>{" "}
                        검색 결과
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSearch}
                    >
                        <X className="h-4 w-4 mr-1" />
                        검색 취소
                    </Button>
                </div>
            )}

            {/* 탭 (검색 중이 아닐 때만 표시) */}
            {!isSearching && (
                <Tabs
                    defaultValue="popular"
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="mb-6"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="popular">인기</TabsTrigger>
                        <TabsTrigger value="random">둘러보기</TabsTrigger>
                    </TabsList>
                </Tabs>
            )}

            {/* 게시물 그리드 */}
            <PostGrid posts={posts} lastPostRef={lastPostElementRef} />

            {/* 로딩 표시 */}
            {isLoading && posts.length > 0 && (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* 더 이상 결과가 없음 */}
            {!isLoading && !hasMore && posts.length > 0 && (
                <div className="text-center py-6 text-muted-foreground">
                    더 이상 표시할 게시물이 없습니다.
                </div>
            )}

            {/* 검색 결과 없음 */}
            {!isLoading && isSearching && posts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg mb-2">검색 결과가 없습니다.</p>
                    <p className="text-sm">다른 검색어를 입력해보세요.</p>
                </div>
            )}
        </div>
    );
};

export default SNSExplorePage;
