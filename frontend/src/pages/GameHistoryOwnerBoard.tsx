import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem 
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { UTCToKST } from "@/lib/dateFormat";
import { Loader2, ChevronRight, Search, SortAsc, Filter } from "lucide-react";

export interface UserGameHistoryDto {
    uuid: string;
    guildSnowflake: string;
    userSnowflake: string;
    playerName: string;
    win: boolean;
    createdAt: string;
    characterName: string;
    ownerMemo: string;
    themeId: string | null;
    themeName: string | null;
}

interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

type SortType = "LATEST" | "OLDEST";
const PAGE_SIZE = 10;

/* ------------------------------ 쿼리 훅 ------------------------------ */
const useHistories = (
    guildId: string,
    page: number,
    keyword: string,
    sortType: SortType
) =>
    useQuery<Page<UserGameHistoryDto>>({
        queryKey: ["histories", guildId, page, keyword, sortType],
        queryFn: async () => {
            const q = keyword ? `&query=${encodeURIComponent(keyword)}` : "";
            const sort = `&sort=${sortType}`;
            return apiClient.get<Page<UserGameHistoryDto>>(
                `/histories/crime_scene/owner/${guildId}?page=${page}&size=${PAGE_SIZE}${sort}${q}`
            );
        },
        keepPreviousData: true,
        enabled: !!guildId,
    });

const usePatchHistory = () =>
    useMutation({
        mutationFn: async ({
            dto,
        }: {
            dto: Partial<UserGameHistoryDto> & {
                userSnowflake: string;
                guildSnowflake: string;
            };
        }) => {
            const { userSnowflake, guildSnowflake, ...body } = dto;
            await apiClient.patch<void>(
                `/histories/crime_scene/${userSnowflake}/guild/${guildSnowflake}`,
                body
            );
        },
    });

/* ------------------------------ 컴포넌트 ------------------------------ */
const GameHistoryManager: React.FC = () => {
    const [page, setPage] = useState(0);
    const [sortType, setSortType] = useState<SortType>("LATEST");
    const [searchText, setSearchText] = useState("");
    const [keyword, setKeyword] = useState("");
    const [searchField, setSearchField] = useState("playerName");
    const [editing, setEditing] = useState<UserGameHistoryDto | null>(null);
    const [memoText, setMemoText] = useState("");
    const qc = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null); // 🔥 검색창 포커스

    const { state } = useLocation();
    const params = useParams<{ guildId?: string }>();
    const location = useLocation();
    
    // URL 쿼리 파라미터 파싱
    const queryParams = new URLSearchParams(location.search);
    const pageParam = queryParams.get('page');
    const keywordParam = queryParams.get('kw');
    const sortParam = queryParams.get('sort');

    const guildId = useMemo(
        () =>
            params.guildId ||
            (state as any)?.guildId ||
            sessionStorage.getItem("guildId") ||
            "",
        [params.guildId, state]
    );

    const guildName = useMemo(
        () =>
            (state as any)?.guildName ||
            sessionStorage.getItem("guildName") ||
            "",
        [state]
    );

    useEffect(() => {
        if (guildId) sessionStorage.setItem("guildId", guildId);
        if (guildName) sessionStorage.setItem("guildName", guildName);
    }, [guildId, guildName]);

    const { data, isFetching, isError } = useHistories(
        guildId,
        page,
        keyword,
        sortType
    );
    const patchMutation = usePatchHistory();

    const pageInfo = useMemo(
        () => ({
            isFirst: page === 0,
            isLast: !data || page + 1 >= data.totalPages,
        }),
        [page, data]
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);
    
    useEffect(() => {
        if (editing) {
            setMemoText(editing.ownerMemo || "");
        }
    }, [editing]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editing) return;

        const fd = new FormData(e.currentTarget);
        patchMutation.mutate(
            {
                dto: {
                    userSnowflake: editing.userSnowflake,
                    guildSnowflake: editing.guildSnowflake,
                    win: fd.get("win") === "on",
                    createdAt: fd.get("createdAt") as string,
                    characterName: fd.get("characterName") as string,
                    memo: memoText,
                },
            },
            {
                onSuccess: () => {
                    toast.success("기록이 수정되었습니다");
                    setEditing(null);
                    qc.invalidateQueries({ queryKey: ["histories", guildId] });
                },
                onError: () => toast.error("수정 중 오류가 발생했습니다"),
            }
        );
    };

    const getSortTypeName = (sortType: SortType): string => {
        switch (sortType) {
            case "LATEST":
                return '최신순';
            case "OLDEST":
                return '오래된순';
            default:
                return '최신순';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSearch = () => {
        const trimmed = searchText.trim();
        setKeyword(trimmed); // 빈 문자열이면 전체 검색
        setPage(0);
        inputRef.current?.focus();
    };

    const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-center">
                    {guildName} · 게임 기록
                </h1>
                <p className="text-muted-foreground mt-1 text-center">
                    플레이어별 승패 및 캐릭터 기록을 관리합니다.
                </p>
                <p className="text-muted-foreground text-sm text-center">
                    웹가입이 없는 유저는 개인정보 보호를 위해 * 으로 마스킹 처리됩니다.
                </p>
            </div>
            
            <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="p-4 pb-0">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="all">전체 기록</TabsTrigger>
                                <TabsTrigger value="win">승리 기록</TabsTrigger>
                                <TabsTrigger value="lose">패배 기록</TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" className="p-0 mt-0">
                                {/* 검색 + 정렬 */}
                                <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center w-full mb-4">
                                    {/* 검색 조건 선택 */}
                                    <div className="flex items-center mr-0 md:mr-2 w-full md:w-auto">
                                        <Select 
                                            value={searchField} 
                                            onValueChange={setSearchField}
                                        >
                                            <SelectTrigger className="w-full md:w-[140px] h-9 text-xs">
                                                <SelectValue placeholder="검색 조건" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="playerName">플레이어 이름</SelectItem>
                                                <SelectItem value="characterName">캐릭터 이름</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* 검색창 */}
                                    <div className="relative flex-grow max-w-full md:max-w-sm">
                                        <div className="relative flex items-center w-full">
                                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                ref={inputRef}
                                                type="text"
                                                placeholder="검색어를 입력하세요"
                                                className="pl-8 pr-20 h-9 text-sm"
                                                value={searchText}
                                                onChange={handleKeywordChange}
                                                onKeyDown={handleKeyDown}
                                            />
                                            <Button 
                                                type="button" 
                                                size="sm" 
                                                onClick={handleSearch}
                                                className="absolute right-0 h-9 text-xs px-3 rounded-l-none"
                                            >
                                                검색
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 정렬 드롭다운 */}
                                    <div className="md:ml-auto flex items-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-9 flex items-center gap-1 text-xs ml-0 md:ml-2">
                                                    <SortAsc className="h-3.5 w-3.5" />
                                                    <span>{getSortTypeName(sortType)}</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                <DropdownMenuRadioGroup value={sortType} onValueChange={(value) => {
                                                    setSortType(value as SortType);
                                                    setPage(0);
                                                }}>
                                                    <DropdownMenuRadioItem value="LATEST" className="text-xs">최신순</DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="OLDEST" className="text-xs">오래된순</DropdownMenuRadioItem>
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* 총 개수 표시 */}
                                {data && (
                                    <div className="text-right text-sm text-muted-foreground mb-4">
                                        총 {data.totalElements}건
                                    </div>
                                )}

                                {/* 로딩/에러/리스트 */}
                                {isFetching ? (
                                    <div className="py-20 text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto">
                                        </div>
                                        <p className="mt-4 text-muted-foreground">게임 기록을 불러오는 중...</p>
                                    </div>
                                ) : isError ? (
                                    <div className="py-20 text-center">
                                        <p className="text-destructive">데이터를 불러오는 중 오류가 발생했습니다.</p>
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={() => qc.invalidateQueries({ queryKey: ["histories", guildId] })}
                                        >
                                            다시 시도
                                        </Button>
                                    </div>
                                ) : data && data.content.length === 0 ? (
                                    <div className="py-12 text-center border-t border-b border-gray-200 dark:border-gray-700">
                                        <div className="mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/50 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-muted-foreground mb-2">아직 게임 기록이 없습니다.</p>
                                        <p className="text-sm text-muted-foreground/70">게임을 플레이하면 기록이 쌓입니다.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* 데스크탑 테이블 */}
                                        <div className="hidden md:block border-t border-b border-gray-200 dark:border-gray-700">
                                            {/* 테이블 헤더 */}
                                            <div className="bg-muted/40 py-2 px-4 flex">
                                                <div className="flex-shrink-0 w-32 text-xs font-medium text-muted-foreground">플레이어</div>
                                                <div className="flex-shrink-0 w-28 text-xs font-medium text-muted-foreground">캐릭터</div>
                                                <div className="flex-shrink-0 w-12 text-center text-xs font-medium text-muted-foreground">승패</div>
                                                <div className="flex-shrink-0 w-32 text-xs font-medium text-muted-foreground">테마</div>
                                                <div className="flex-grow text-xs font-medium text-muted-foreground">메모</div>
                                                <div className="flex-shrink-0 w-36 text-xs font-medium text-muted-foreground">날짜</div>
                                                <div className="flex-shrink-0 w-16 text-xs font-medium text-muted-foreground"></div>
                                            </div>
                                            
                                            {/* 테이블 내용 */}
                                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {data.content.map((h) => (
                                                    <div key={h.uuid} className="flex items-center px-4 py-3 hover:bg-muted/20 transition-colors">
                                                        <div className="flex-shrink-0 w-32 font-medium truncate" title={h.playerName}>
                                                            {h.playerName}
                                                        </div>
                                                        <div className="flex-shrink-0 w-28 truncate" title={h.characterName}>
                                                            {h.characterName}
                                                        </div>
                                                        <div className="flex-shrink-0 w-12 text-center">
                                                            {h.win ? (
                                                                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-400">✓</span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 rounded-full dark:bg-red-900/30 dark:text-red-400">✗</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-shrink-0 w-32 truncate">
                                                            {h.themeName ?? "(미등록)"}
                                                        </div>
                                                        <div className="flex-grow truncate px-2" title={h.ownerMemo || "-"}>
                                                            {h.ownerMemo || "-"}
                                                        </div>
                                                        <div className="flex-shrink-0 w-36 text-muted-foreground text-sm">
                                                            <UTCToKST date={h.createdAt} />
                                                        </div>
                                                        <div className="flex-shrink-0 w-16 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setEditing(h)}
                                                            >
                                                                편집
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 모바일 카드 */}
                                        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                                            {data.content.map((h) => (
                                                <div
                                                    key={h.uuid}
                                                    className="p-4 flex flex-col gap-2"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="font-medium text-base">
                                                            {h.playerName}
                                                        </div>
                                                        <div>
                                                            {h.win ? (
                                                                <span className="inline-flex items-center justify-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full dark:bg-green-900/30 dark:text-green-400">
                                                                    승리
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full dark:bg-red-900/30 dark:text-red-400">
                                                                    패배
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm space-y-2 mt-1 text-muted-foreground">
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-foreground">캐릭터</span>
                                                            <span>{h.characterName}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-foreground">테마</span>
                                                            <span>{h.themeName ?? "(미등록)"}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-foreground">메모</span>
                                                            <span className="text-right max-w-[65%] truncate" title={h.ownerMemo || "-"}>{h.ownerMemo || "-"}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="font-medium text-foreground">날짜</span>
                                                            <span><UTCToKST date={h.createdAt} /></span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="self-end mt-2"
                                                        onClick={() => setEditing(h)}
                                                    >
                                                        편집
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="win" className="p-0 mt-0">
                                <div className="py-12 text-center border-t border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-muted-foreground">승리 기록 필터링 기능은 준비 중입니다.</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="lose" className="p-0 mt-0">
                                <div className="py-12 text-center border-t border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-muted-foreground">패배 기록 필터링 기능은 준비 중입니다.</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* 페이지네이션 */}
                    {data && data.totalPages > 1 && (
                        <div className="py-4 px-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex flex-wrap justify-center items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pageInfo.isFirst || isFetching}
                                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                                >
                                    이전
                                </Button>
                                
                                {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                                    // 5개만 표시하고 중앙에 현재 페이지가 오도록 조정
                                    let startPage = Math.max(0, Math.min(page - 2, data.totalPages - 5));
                                    if (data.totalPages <= 5) startPage = 0;
                                    const pageNum = startPage + i;
                                    
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={page === pageNum ? "default" : "outline"}
                                            size="sm"
                                            disabled={isFetching}
                                            onClick={() => setPage(pageNum)}
                                            className="min-w-8"
                                        >
                                            {pageNum + 1}
                                        </Button>
                                    );
                                })}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pageInfo.isLast || isFetching}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    다음
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 편집 다이얼로그 */}
            <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
                {editing && (
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>게임 기록 편집</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="win"
                                    name="win"
                                    defaultChecked={editing.win}
                                />
                                <Label htmlFor="win">승리</Label>
                            </div>
                            <div>
                                <span className="font-medium">날짜:</span>{" "}
                                <UTCToKST date={editing.createdAt} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="characterName">
                                    캐릭터 이름
                                </Label>
                                <Input
                                    id="characterName"
                                    name="characterName"
                                    defaultValue={editing.characterName}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="memo">메모 (300자 이내)</Label>
                                <textarea
                                    id="memo"
                                    name="memo"
                                    value={memoText}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 300) {
                                            setMemoText(e.target.value);
                                        }
                                    }}
                                    rows={4}
                                    className="w-full border rounded-md p-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <div className="text-xs text-right text-muted-foreground">
                                    {memoText.length} / 300
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={patchMutation.isPending}
                                >
                                    저장
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
};

export default GameHistoryManager;