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
import { useLocation, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { UTCToKST } from "@/lib/dateFormat";
import { Loader2 } from "lucide-react"; // 🔥 로딩 스피너 추가

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
    const [editing, setEditing] = useState<UserGameHistoryDto | null>(null);
    const qc = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null); // 🔥 검색창 포커스

    const { state } = useLocation();
    const params = useParams<{ guildId?: string }>();

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
                    memo: fd.get("memo") as string,
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

    const handleSearch = () => {
        const trimmed = searchText.trim();
        setKeyword(trimmed); // 빈 문자열이면 전체 검색
        setPage(0);
        inputRef.current?.focus(); // 🔥 검색 후 포커스
    };

    return (
        <div className="space-y-6 px-4 md:px-8 lg:px-12 xl:px-20 py-6">
            <header className="text-center space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold">
                    {guildName} · 게임 기록
                </h1>
                <p className="text-muted-foreground text-sm">
                    플레이어별 승패 및 캐릭터 기록을 관리합니다.
                </p>
                <p className="text-muted-foreground text-sm">
                    웹가입이 없는 유저는 개인정보 보호를 위해 * 으로 마스킹
                    처리됩니다.
                </p>
            </header>

            {/* 검색 + 정렬 */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center">
                <Input
                    ref={inputRef}
                    placeholder="검색 지원 예정"
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
                    {(["LATEST", "OLDEST"] as SortType[]).map((type) => (
                        <Button
                            key={type}
                            variant={sortType === type ? "default" : "outline"}
                            onClick={() => {
                                setSortType(type);
                                setPage(0);
                            }}
                        >
                            {type === "LATEST" && "최신순"}
                            {type === "OLDEST" && "오래된순"}
                        </Button>
                    ))}
                </div>
            </div>

            {/* 총 갯수 표시 */}
            {data && (
                <div className="text-center text-sm text-muted-foreground mb-4">
                    총 {data.totalElements}건
                </div>
            )}

            {/* 로딩 처리 */}
            {isFetching ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : !isError && data ? (
                <>
                    {/* 데스크탑 테이블 */}
                    <div className="hidden md:block">
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-4 py-2 text-left">
                                            플레이어
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
                                            <td className="px-4 py-2 font-medium">
                                                {h.playerName}
                                            </td>
                                            <td className="px-4 py-2">
                                                {h.characterName}
                                            </td>
                                            <td className="px-4 py-2">
                                                {h.win ? "✅" : "❌"}
                                            </td>
                                            <td className="px-4 py-2">
                                                {h.themeName ?? "(미등록)"}
                                            </td>
                                            <td className="px-4 py-2">
                                                {h.ownerMemo || "-"}
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
                                                    편집
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 모바일 카드 리스트 */}
                    <ul className="md:hidden space-y-3">
                        {data.content.map((h) => (
                            <li
                                key={h.uuid}
                                className="glass rounded-xl p-4 flex flex-col gap-2 card-hover"
                            >
                                <div className="flex justify-between">
                                    <div className="font-semibold">
                                        {h.playerName}
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
                                        {h.themeName ?? "(미등록)"}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            메모:
                                        </span>{" "}
                                        {h.ownerMemo || "-"}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            날짜:
                                        </span>{" "}
                                        {format(
                                            new Date(h.createdAt),
                                            "yy.MM.dd HH:mm",
                                            { locale: ko }
                                        )}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className="self-end mt-2"
                                    onClick={() => setEditing(h)}
                                >
                                    편집
                                </Button>
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <div className="text-center py-10 text-destructive">
                    데이터를 불러오는 중 오류가 발생했습니다.
                </div>
            )}

            {/* 페이지네이션 */}
            {data && data.totalPages > 1 && (
                <nav className="flex justify-center items-center gap-4 mt-6">
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
                                <Label htmlFor="memo">메모</Label>
                                <textarea
                                    id="memo"
                                    name="memo"
                                    defaultValue={editing.ownerMemo}
                                    rows={3}
                                    className="w-full border rounded-md p-2 text-sm
               text-foreground bg-background
               focus:outline-none focus:ring-2 focus:ring-primary"
                                />
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
