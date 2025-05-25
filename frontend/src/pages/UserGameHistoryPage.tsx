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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { UTCToKST } from "@/lib/dateFormat";
import { Loader2, ChevronRight, Search, SortAsc, Filter } from "lucide-react";
import GameHistoryFilter from "@/components/game/GameHistoryFilter";
import GameHistoryItem from "@/components/game/GameHistoryItem";

export interface UserGameHistoryDto {
    uuid: string;
    guildSnowflake: string;
    userSnowflake: string;
    playerName: string;
    win: boolean;
    createdAt: string;
    characterName: string;
    memo: string;
    themeId: string | null;
    themeName: string | null;
    guildName: string;
}

interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

const PAGE_SIZE = 10;
type SortType = "LATEST" | "OLDEST" | "GUILDNAME";

const useUserHistories = (
    webUserId: string,
    page: number,
    keyword: string,
    sortType: SortType,
    winFilter?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    hasTheme?: boolean | null
) =>
    useQuery<Page<UserGameHistoryDto>>({
        queryKey: [
            "my-histories",
            webUserId,
            page,
            keyword,
            sortType,
            winFilter,
            startDate,
            endDate,
            hasTheme,
        ],
        queryFn: async () => {
            // 모든 쿼리 파라미터 구성
            const params = new URLSearchParams();

            // 기본 파라미터
            params.append("page", page.toString());
            params.append("size", PAGE_SIZE.toString());
            params.append("sort", sortType);

            // 검색어
            if (keyword) {
                params.append("query", keyword);
            }

            // 추가 필터링 파라미터
            if (winFilter !== null && winFilter !== undefined) {
                params.append("win", winFilter.toString());
            }

            if (startDate) {
                params.append("startDate", startDate);
            }

            if (endDate) {
                params.append("endDate", endDate);
            }

            if (hasTheme !== null && hasTheme !== undefined) {
                params.append("hasTheme", hasTheme.toString());
            }

            // URL 생성
            const url = `/histories/crime_scene/user/${webUserId}/filter?${params.toString()}`;
            return apiClient.get<Page<UserGameHistoryDto>>(url);
        },
        keepPreviousData: true,
        enabled: !!webUserId,
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

const UserGameHistoryPage: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // URL 쿼리 파라미터 파싱
    const queryParams = new URLSearchParams(location.search);
    const pageParam = queryParams.get("page");
    const keywordParam = queryParams.get("kw");
    const sortParam = queryParams.get("sort");

    const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 0);
    const [keyword, setKeyword] = useState(keywordParam || "");
    const [searchText, setSearchText] = useState(keywordParam || "");
    const [sortType, setSortType] = useState<SortType>(
        (sortParam as SortType) || "LATEST"
    );
    const [editing, setEditing] = useState<UserGameHistoryDto | null>(null);
    const [memoText, setMemoText] = useState("");
    const [searchField, setSearchField] = useState("guildName");
    const qc = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // URL 쿼리 파라미터 업데이트
    useEffect(() => {
        const params = new URLSearchParams();
        if (page > 0) params.append("page", page.toString());
        if (keyword) params.append("kw", keyword);
        if (sortType !== "LATEST") params.append("sort", sortType);

        const newSearch = params.toString();
        const path = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`;

        navigate(path, { replace: true });
    }, [page, keyword, sortType, navigate, location.pathname]);

    const { data, isFetching, isError } = useUserHistories(
        user?.id ?? "",
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
        if (editing) {
            setMemoText(editing.memo || "");
        }
    }, [editing]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);

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
                    qc.invalidateQueries({
                        queryKey: ["my-histories", user?.id],
                    });
                },
                onError: () => toast.error("수정 중 오류가 발생했습니다"),
            }
        );
    };

    const handleSearch = () => {
        const trimmed = searchText.trim();
        setKeyword(trimmed);
        setPage(0);
        inputRef.current?.focus();
    };

    const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">내 게임 기록</h1>
                <p className="text-muted-foreground mt-1">
                    본인이 플레이한 기록을 확인하고 수정할 수 있습니다.
                </p>
            </div>

            <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="p-4 pb-0">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="all">전체 기록</TabsTrigger>
                                <TabsTrigger value="win">승리 기록</TabsTrigger>
                                <TabsTrigger value="lose">
                                    패배 기록
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" className="p-0 mt-0">
                                {/* 검색 + 정렬 */}
                                <GameHistoryFilter
                                    sortType={sortType}
                                    onSortChange={setSortType}
                                    keyword={searchText}
                                    onKeywordChange={handleKeywordChange}
                                    onSearch={handleSearch}
                                    searchField={searchField}
                                    onSearchFieldChange={setSearchField}
                                    inputRef={inputRef}
                                />

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
                                            <Loader2 className="h-12 w-12 text-primary opacity-0" />
                                        </div>
                                        <p className="mt-4 text-muted-foreground">
                                            게임 기록을 불러오는 중...
                                        </p>
                                    </div>
                                ) : isError ? (
                                    <div className="py-20 text-center">
                                        <p className="text-destructive">
                                            데이터를 불러오는 중 오류가
                                            발생했습니다.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={() =>
                                                qc.invalidateQueries({
                                                    queryKey: [
                                                        "my-histories",
                                                        user?.id,
                                                    ],
                                                })
                                            }
                                        >
                                            다시 시도
                                        </Button>
                                    </div>
                                ) : data && data.content.length === 0 ? (
                                    <div className="py-12 text-center border-t border-b border-gray-200 dark:border-gray-700">
                                        <div className="mb-4">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-12 w-12 text-muted-foreground/50 mx-auto"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-muted-foreground mb-2">
                                            아직 게임 기록이 없습니다.
                                        </p>
                                        <p className="text-sm text-muted-foreground/70">
                                            게임을 플레이하면 기록이 쌓입니다.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* 데스크탑 테이블 */}
                                        <div className="hidden md:block border-t border-b border-gray-200 dark:border-gray-700">
                                            {/* 테이블 헤더 */}
                                            <div className="bg-muted/40 py-2 px-4 flex">
                                                <div className="flex-shrink-0 w-36 text-xs font-medium text-muted-foreground">
                                                    서버이름
                                                </div>
                                                <div className="flex-shrink-0 w-28 text-xs font-medium text-muted-foreground">
                                                    캐릭터
                                                </div>
                                                <div className="flex-shrink-0 w-12 text-center text-xs font-medium text-muted-foreground">
                                                    승패
                                                </div>
                                                <div className="flex-shrink-0 w-40 text-xs font-medium text-muted-foreground">
                                                    테마
                                                </div>
                                                <div className="flex-grow text-xs font-medium text-muted-foreground">
                                                    메모
                                                </div>
                                                <div className="flex-shrink-0 w-36 text-xs font-medium text-muted-foreground">
                                                    날짜
                                                </div>
                                                <div className="flex-shrink-0 w-16 text-xs font-medium text-muted-foreground"></div>
                                            </div>

                                            {/* 테이블 내용 */}
                                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {data.content.map((h) => (
                                                    <div
                                                        key={h.uuid}
                                                        className="flex items-center px-4 py-3 hover:bg-muted/20 transition-colors"
                                                    >
                                                        <div
                                                            className="flex-shrink-0 w-36 font-medium truncate"
                                                            title={h.guildName}
                                                        >
                                                            {h.guildName}
                                                        </div>
                                                        <div
                                                            className="flex-shrink-0 w-28 truncate"
                                                            title={
                                                                h.characterName
                                                            }
                                                        >
                                                            {h.characterName}
                                                        </div>
                                                        <div className="flex-shrink-0 w-12 text-center">
                                                            {h.win ? (
                                                                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                                                    ✓
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 rounded-full dark:bg-red-900/30 dark:text-red-400">
                                                                    ✗
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-shrink-0 w-40">
                                                            {h.themeId ? (
                                                                <span
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/themes/crimescene/${h.themeId}`
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 px-2 py-1 text-xs font-medium rounded-md cursor-pointer transition dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                                                    role="button"
                                                                    aria-label={`${h.themeName} 테마 보기`}
                                                                >
                                                                    {
                                                                        h.themeName
                                                                    }
                                                                    <ChevronRight className="w-3 h-3" />
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs">
                                                                    (미등록)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div
                                                            className="flex-grow truncate px-2"
                                                            title={
                                                                h.memo || "-"
                                                            }
                                                        >
                                                            {h.memo || "-"}
                                                        </div>
                                                        <div className="flex-shrink-0 w-36 text-muted-foreground text-sm">
                                                            <UTCToKST
                                                                date={
                                                                    h.createdAt
                                                                }
                                                            />
                                                        </div>
                                                        <div className="flex-shrink-0 w-16 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setEditing(
                                                                        h
                                                                    )
                                                                }
                                                            >
                                                                수정
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 모바일 카드 */}
                                        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                                            {data.content.map((history) => (
                                                <GameHistoryItem
                                                    key={history.uuid}
                                                    history={history}
                                                    onEdit={setEditing}
                                                    isMobile
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="win" className="p-0 mt-0">
                                <div className="py-12 text-center border-t border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-muted-foreground">
                                        승리 기록 필터링 기능은 준비 중입니다.
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="lose" className="p-0 mt-0">
                                <div className="py-12 text-center border-t border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-muted-foreground">
                                        패배 기록 필터링 기능은 준비 중입니다.
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* 페이지네이션 */}
                    {data && data.totalPages > 1 && (
                        <div className="py-4 px-4 border-t border-gray-200 dark:border-gray-700">
                            <GamePagination
                                currentPage={page}
                                totalPages={data.totalPages}
                                onPageChange={setPage}
                                disabled={isFetching}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 수정 다이얼로그 */}
            <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
                {editing && (
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>기록 수정</DialogTitle>
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

export default UserGameHistoryPage;
