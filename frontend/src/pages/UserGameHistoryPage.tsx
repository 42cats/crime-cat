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
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { UTCToKST } from "@/lib/dateFormat";
import { Loader2, ChevronRight } from "lucide-react";

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
    sortType: SortType
) =>
    useQuery<Page<UserGameHistoryDto>>({
        queryKey: ["my-histories", webUserId, page, keyword, sortType],
        queryFn: async () => {
            const q = keyword ? `&query=${encodeURIComponent(keyword)}` : "";
            const sort = sortType ? `&sort=${sortType}` : "";
            return apiClient.get<Page<UserGameHistoryDto>>(
                `/histories/crime_scene/user/${webUserId}?page=${page}&size=${PAGE_SIZE}${sort}${q}`
            );
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
    const [page, setPage] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [searchText, setSearchText] = useState("");
    const [sortType, setSortType] = useState<SortType>("LATEST");
    const [editing, setEditing] = useState<UserGameHistoryDto | null>(null);
    const [memoText, setMemoText] = useState("");
    const qc = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, navigate]);

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

    return (
        <div className="space-y-6 px-4 md:px-8 lg:px-12 xl:px-20 py-6">
            <header className="text-center space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold">내 게임 기록</h1>
                <p className="text-muted-foreground text-sm">
                    본인이 플레이한 기록을 확인하고 수정할 수 있습니다.
                </p>
            </header>

            {/* 검색 + 정렬 */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center">
                <Input
                    ref={inputRef}
                    placeholder="길드 이름으로 검색"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearch();
                        }
                    }}
                    className="w-full sm:max-w-md"
                />
                <Button onClick={handleSearch}>검색</Button>
                <div className="flex gap-2">
                    {(["LATEST", "OLDEST", "GUILDNAME"] as SortType[]).map(
                        (type) => (
                            <Button
                                key={type}
                                variant={
                                    sortType === type ? "default" : "outline"
                                }
                                onClick={() => {
                                    setSortType(type);
                                    setPage(0);
                                }}
                            >
                                {type === "LATEST" && "최신순"}
                                {type === "OLDEST" && "오래된순"}
                                {type === "GUILDNAME" && "길드 가나다순"}
                            </Button>
                        )
                    )}
                </div>
            </div>

            {/* 총 개수 표시 */}
            {data && (
                <div className="text-center text-sm text-muted-foreground mb-4">
                    총 {data.totalElements}건
                </div>
            )}

            {/* 로딩/에러/리스트 */}
            {isFetching ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : isError ? (
                <div className="text-center py-10 text-destructive">
                    데이터를 불러오는 중 오류가 발생했습니다.
                </div>
            ) : data && data.content.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    아직 게임 기록이 없습니다.
                </div>
            ) : (
                <>
                    {/* 데스크탑 테이블 */}
                    <div className="hidden md:block">
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-4 py-2 text-left">
                                            서버이름
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            캐릭터
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            승패
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            테마
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            메모
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            날짜
                                        </th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.content.map((h) => (
                                        <tr key={h.uuid} className="border-t">
                                            <td className="px-4 py-2">
                                                {h.guildName}
                                            </td>
                                            <td className="px-4 py-2">
                                                {h.characterName}
                                            </td>
                                            <td className="px-4 py-2">
                                                {h.win ? "✅" : "❌"}
                                            </td>
                                            <td className="px-4 py-2">
                                                {h.themeId ? (
                                                    <span
                                                        onClick={() =>
                                                            navigate(
                                                                `/themes/crimescene/${h.themeId}`
                                                            )
                                                        }
                                                        className="
                              inline-flex items-center gap-1
                              bg-blue-50 text-blue-700
                              hover:bg-blue-100 hover:text-blue-800
                              px-2 py-1 text-sm font-medium
                              rounded-lg cursor-pointer transition
                            "
                                                        role="button"
                                                        aria-label={`${h.themeName} 테마 보기`}
                                                    >
                                                        {h.themeName}
                                                        <ChevronRight className="w-4 h-4" />
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        (미등록)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                {h.memo || "-"}
                                            </td>
                                            <td className="px-4 py-2">
                                                <UTCToKST date={h.createdAt} />
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        setEditing(h)
                                                    }
                                                >
                                                    수정
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 모바일 카드 */}
                    <ul className="md:hidden space-y-3">
                        {data.content.map((h) => (
                            <li
                                key={h.uuid}
                                className="glass rounded-xl p-4 flex flex-col gap-2 card-hover"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="font-semibold">
                                        {h.guildName}
                                    </div>
                                    <div className="font-bold">
                                        {h.win ? "✅ 승" : "❌ 패"}
                                    </div>
                                </div>
                                <div className="text-sm space-y-1 mt-1 text-muted-foreground">
                                    <div>
                                        <span className="font-medium">
                                            캐릭터:
                                        </span>{" "}
                                        {h.characterName}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            테마:
                                        </span>{" "}
                                        {h.themeId ? (
                                            <span
                                                onClick={() =>
                                                    navigate(
                                                        `/themes/crimescene/${h.themeId}`
                                                    )
                                                }
                                                className="
                          inline-flex items-center gap-1
                          bg-blue-50 text-blue-700
                          hover:bg-blue-100 hover:text-blue-800
                          px-2 py-0.5 text-xs font-medium
                          rounded-lg cursor-pointer transition
                        "
                                                role="button"
                                                aria-label={`${h.themeName} 테마 보기`}
                                            >
                                                {h.themeName}
                                                <ChevronRight className="w-3 h-3" />
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                (미등록)
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            메모:
                                        </span>{" "}
                                        {h.memo || "-"}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            날짜:
                                        </span>{" "}
                                        <UTCToKST date={h.createdAt} />
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className="self-end mt-2"
                                    onClick={() => setEditing(h)}
                                >
                                    수정
                                </Button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {/* 페이지네이션 */}
            {data && data.totalPages > 1 && (
                <nav className="flex flex-wrap justify-center items-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pageInfo.isFirst || isFetching}
                        onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    >
                        이전
                    </Button>
                    {Array.from({ length: data.totalPages }, (_, i) => (
                        <Button
                            key={i}
                            variant={page === i ? "default" : "outline"}
                            size="sm"
                            disabled={isFetching}
                            onClick={() => setPage(i)}
                        >
                            {i + 1}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pageInfo.isLast || isFetching}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        다음
                    </Button>
                </nav>
            )}

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
