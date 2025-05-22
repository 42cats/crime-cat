import React, { useState, useEffect, useRef, useCallback } from "react";
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

            setIsLoading(true);
            try {
                let postsData;

                if (isSearching && localSearchQuery.trim()) {
                    // 통합 검색 (키워드 또는 해시태그)
                    postsData = await searchService.searchPosts(
                        localSearchQuery.trim(),
                        currentPage
                    );
                } else if (activeTab === "popular") {
                    // 인기 게시물
                    postsData = await exploreService.getPopularPosts(
                        currentPage
                    );
                } else {
                    // 무작위 게시물
                    postsData = await exploreService.getRandomPosts(
                        currentPage
                    );
                }

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
        [activeTab, page, isLoading, hasMore, isSearching, localSearchQuery]
    );

    // 인기 해시태그 로드
    const loadPopularHashtags = useCallback(async () => {
        try {
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
    }, []);

    // URL 파라미터 변경 감지
    useEffect(() => {
        const urlSearchQuery = searchParams.get("search") || "";
        if (urlSearchQuery !== localSearchQuery) {
            setLocalSearchQuery(urlSearchQuery);
            setIsSearching(!!urlSearchQuery);
            setPosts([]);
            setPage(0);
            setHasMore(true);
        }
    }, [searchParams]);

    // 첫 로드
    useEffect(() => {
        loadPosts(true);
        if (!isSearching) {
            loadPopularHashtags();
        }
    }, [activeTab, isSearching, localSearchQuery]);

    // 탭 변경 시 데이터 초기화
    const handleTabChange = (tab: string) => {
        if (tab !== activeTab) {
            setActiveTab(tab);
            setPosts([]);
            setPage(0);
            setHasMore(true);
            setIsSearching(false);
            setLocalSearchQuery("");
            setSearchParams({});
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

    // 검색 처리
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (localSearchQuery.trim()) {
            setSearchParams({ search: localSearchQuery.trim() });
        }
    };

    // 검색 취소
    const handleClearSearch = () => {
        setLocalSearchQuery("");
        setSearchParams({});
    };

    // 해시태그 클릭
    const handleHashtagClick = (tag: string) => {
        const hashtagQuery = `#${tag}`;
        setLocalSearchQuery(hashtagQuery);
        setSearchParams({ search: hashtagQuery });
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
                        onChange={(e) => setLocalSearchQuery(e.target.value)}
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
