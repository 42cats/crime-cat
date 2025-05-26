import React, { useState, useEffect, useRef, useCallback } from "react";
import { userGameHistoryService, UserGameHistoryDto } from "@/api/game/userGameHistoryService";
import GameHistoryListItem from "./GameHistoryListItem";
import { Loader2, GamepadIcon } from "lucide-react";

interface ProfileCrimeSceneGridProps {
    userId: string;
}

const ProfileCrimeSceneGrid: React.FC<ProfileCrimeSceneGridProps> = ({ userId }) => {
    const [histories, setHistories] = useState<UserGameHistoryDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    // 마지막 요소 참조 콜백 함수
    const lastElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (loading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prevPage) => prevPage + 1);
                }
            });

            if (node) observer.current.observe(node);
        },
        [loading, hasMore]
    );

    // 크라임씬 기록 가져오기
    const fetchHistories = useCallback(async () => {
        if (!userId || !hasMore || loading) return;

        setLoading(true);
        setError(null);

        try {
            const response = await userGameHistoryService.getCrimeSceneHistories(userId, page);
            
            if (page === 0) {
                setHistories(response.content);
            } else {
                setHistories((prev) => [...prev, ...response.content]);
            }
            
            setHasMore(!response.last);
        } catch (err) {
            console.error("크라임씬 기록 조회 실패:", err);
            setError("크라임씬 기록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [userId, page, hasMore]);

    // 데이터 초기화 및 첫 페이지 로드
    useEffect(() => {
        setHistories([]);
        setPage(0);
        setHasMore(true);
        setError(null);
    }, [userId]);

    // 페이지 변경 시 데이터 로드
    useEffect(() => {
        fetchHistories();
    }, [fetchHistories]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (page === 0 && loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!histories.length) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-md min-h-[200px]">
                <GamepadIcon size={40} className="mb-3" />
                <p className="text-sm">플레이한 크라임씬이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-0 min-h-[200px]">
            {histories.map((history, index) => {
                const isLast = index === histories.length - 1;
                return (
                    <div
                        key={history.uuid}
                        ref={isLast ? lastElementRef : null}
                    >
                        <GameHistoryListItem
                            themeId={history.themeId}
                            themeName={history.themeName}
                            playDate={history.createdAt}
                            gameType="crimescene"
                            successStatus={history.isWin}
                        />
                    </div>
                );
            })}
            
            {/* 로딩 인디케이터 */}
            {loading && page > 0 && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            )}
        </div>
    );
};

export default ProfileCrimeSceneGrid;