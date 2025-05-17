import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/api/notificationService";
import { NotificationItem } from "@/components/NotificationItem";
import { SystemNotificationItem } from "@/components/notification/SystemNotificationItem";
import { GameRecordNotificationItem } from "@/components/notification/GameRecordNotificationItem";
import { useProcessedNotifications } from "@/hooks/useProcessedNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import {
    Notification,
    NotificationType,
    NotificationStatus,
} from "@/types/notification";
import { useDebounce } from "@/hooks/useDebounce";

const ITEMS_PER_PAGE = 20;

const NotificationListPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    // 처리됨 상태 관리 훈 추가
    const { markAsProcessed } = useProcessedNotifications();

    // 무한 루프 방지를 위한 ref
    const hasProcessedInitialRead = useRef(false);

    // 검색어 디바운스 (기본 500ms 지연)
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // API 파라미터 준비
    const apiParams = useMemo(() => {
        const params: {
            types?: NotificationType[];
            statuses?: NotificationStatus[];
            keyword?: string;
        } = {};

        if (typeFilter !== "all") {
            params.types = [typeFilter as NotificationType];
        }

        if (statusFilter !== "all") {
            params.statuses = [statusFilter as NotificationStatus];
        }

        if (debouncedSearchQuery.trim()) {
            params.keyword = debouncedSearchQuery.trim();
        }

        return params;
    }, [typeFilter, statusFilter, debouncedSearchQuery]);

    // 알림 목록 조회
    const {
        data: notificationPage,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["notifications", currentPage, apiParams],
        queryFn: () =>
            notificationService.getNotifications(
                currentPage,
                ITEMS_PER_PAGE,
                apiParams.types,
                apiParams.statuses,
                apiParams.keyword
            ),
        staleTime: 10000,
    });

    // 개별 알림 읽음 처리
    const markAsReadMutation = useMutation({
        mutationFn: notificationService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({
                queryKey: ["notifications", "unreadCount"],
            });
        },
        onError: (error) => {
            console.error("알림 읽음 처리 실패:", error);
        },
    });

    // 알림 액션 처리 (게임 기록 등)
    const processActionMutation = useMutation({
        mutationFn: ({
            id,
            action,
            data,
        }: {
            id: string;
            action: string;
            data?: any;
        }) => notificationService.processAction(id, action, data),
        onMutate: async ({ id }) => {
            // 즉시 전역 상태에 처리됨 표시
            markAsProcessed(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({
                queryKey: ["notifications", "unreadCount"],
            });
        },
        onError: (error) => {
            console.error("알림 액션 처리 실패:", error);
        },
    });

    // 페이지 진입 시 보이는 모든 미읽음 알림 읽음 처리 (무한 루프 방지)
    useEffect(() => {
        if (notificationPage?.content && !hasProcessedInitialRead.current) {
            hasProcessedInitialRead.current = true;

            const unreadNotifications = notificationPage.content.filter(
                (notification) => notification.status === "UNREAD"
            );

            // 배치로 읽음 처리 (Promise.all 대신 순차적 처리)
            unreadNotifications.forEach((notification, index) => {
                setTimeout(() => {
                    markAsReadMutation.mutate(notification.id);
                }, index * 100); // 100ms 간격으로 순차 청
            });
        }
    }, [notificationPage?.content?.length]); // length를 의존성으로 사용

    // 알림 타입별 컴포넌트 렌더링
    const renderNotificationItem = (notification: Notification) => {
        const commonProps = {
            notification,
            onRead: markAsReadMutation.mutate,
        };

        switch (notification.type) {
            case NotificationType.SYSTEM_NOTICE:
                return (
                    <SystemNotificationItem
                        key={notification.id}
                        {...commonProps}
                    />
                );
            case NotificationType.GAME_RECORD_REQUEST:
                return (
                    <GameRecordNotificationItem
                        key={notification.id}
                        {...commonProps}
                        onAction={(action, data) =>
                            processActionMutation.mutate({
                                id: notification.id,
                                action,
                                data,
                            })
                        }
                        isLoading={processActionMutation.isPending}
                    />
                );
            default:
                return (
                    <NotificationItem key={notification.id} {...commonProps} />
                );
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <p className="text-destructive">
                        알림을 불러오는데 실패했습니다.
                    </p>
                    <Button
                        onClick={() =>
                            queryClient.invalidateQueries({
                                queryKey: ["notifications"],
                            })
                        }
                        className="mt-4"
                    >
                        다시 시도
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">알림</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {notificationPage?.totalElements || 0}개의 알림
                        </span>
                    </div>
                </div>

                {/* 필터 및 검색 */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="알림 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="상태" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체</SelectItem>
                                <SelectItem value="UNREAD">
                                    읽지 않음
                                </SelectItem>
                                <SelectItem value="READ">읽음</SelectItem>
                                <SelectItem value="PROCESSED">
                                    처리됨
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={typeFilter}
                            onValueChange={setTypeFilter}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="유형" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체</SelectItem>
                                <SelectItem value="SYSTEM_NOTICE">
                                    시스템
                                </SelectItem>
                                <SelectItem value="GAME_RECORD_REQUEST">
                                    게임 기록
                                </SelectItem>
                                <SelectItem value="GAME_NOTICE">
                                    게임 알림
                                </SelectItem>
                                <SelectItem value="COMMENT_ALERT">
                                    댓글
                                </SelectItem>
                                <SelectItem value="NEW_THEME">
                                    새 테마
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 알림 목록 */}
                <div className="space-y-4">
                    {notificationPage?.content?.length ? (
                        notificationPage.content.map(renderNotificationItem)
                    ) : (
                        <div className="text-center py-12">
                            <img
                                src="/content/image/emptyNotice.png"
                                alt="알림 없음"
                                className="w-32 h-32 mx-auto mb-4"
                            />
                            <h3 className="text-lg font-semibold mb-2">
                                알림이 없습니다
                            </h3>
                            <p className="text-muted-foreground">
                                새로운 알림이 도착하면 여기에 표시됩니다.
                            </p>
                        </div>
                    )}
                </div>

                {/* 페이지네이션 */}
                {notificationPage && notificationPage.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <Button
                            variant="outline"
                            onClick={() =>
                                setCurrentPage(Math.max(0, currentPage - 1))
                            }
                            disabled={notificationPage.first}
                        >
                            이전
                        </Button>

                        <span className="flex items-center px-4 text-sm">
                            {currentPage + 1} / {notificationPage.totalPages}
                        </span>

                        <Button
                            variant="outline"
                            onClick={() =>
                                setCurrentPage(
                                    Math.min(
                                        notificationPage.totalPages - 1,
                                        currentPage + 1
                                    )
                                )
                            }
                            disabled={notificationPage.last}
                        >
                            다음
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default NotificationListPage;
