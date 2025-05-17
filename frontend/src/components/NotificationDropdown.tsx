import React from "react";
import { useNavigate } from "react-router-dom";
import { NotificationItem } from "@/components/NotificationItem";
import { SystemNotificationItem } from "@/components/notification/SystemNotificationItem";
import { GameRecordNotificationItem } from "@/components/notification/GameRecordNotificationItem";
import { useNotification } from "@/hooks/useNotification";
import { useProcessedNotifications } from "@/hooks/useProcessedNotifications";
import { handleNotificationRouting } from "@/utils/notificationRouting";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Notification, NotificationType } from "@/types/notification";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/api/notificationService";
import { toast } from "sonner";

interface NotificationDropdownProps {
    onClose?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    onClose,
}) => {
    const { recentNotifications, markAsRead } = useNotification();
    const { markAsProcessed } = useProcessedNotifications(); // 처리됨 상태 저장을 위한 훈 추가
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 게임 기록 요청 액션 처리를 위한 mutation
    const processActionMutation = useMutation({
        mutationFn: ({ id, action, data }: { id: string; action: string; data?: any }) =>
            notificationService.processAction(id, action, data),
        onMutate: async ({ id }) => {
            // mutate 함수 호출 즉시 표시 (서버 응답 전)
            markAsProcessed(id);
        },
        onSuccess: (_, variables) => {
            // 서버 응답 성공 시 전역 상태에 처리됨 인디케이터 추가
            markAsProcessed(variables.id);
            
            // React Query 캐시 무효화
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] });
            toast.success("처리되었습니다.");
            if (onClose) onClose(); // 드롭다운 닫기
        },
        onError: (error) => {
            console.error("처리 중 오류:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        },
    });

    // 알림 클릭 처리를 위한 함수 (시스템 알림, 일반 알림)
    const handleNotificationClick = (notification: Notification) => {
        // 읽지 않은 알림이면 읽음 처리
        if (notification.status === "UNREAD") {
            markAsRead(notification.id);
        }
        
        // 드롭다운 닫고 페이지 이동
        handleNotificationRouting.navigateFromDropdown(
            notification,
            navigate,
            onClose!
        );
    };

    // 전체 보기 버튼 클릭 처리
    const handleViewAllClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("전체 보기 클릭됨");
        if (onClose) {
            onClose();
        }
        navigate("/dashboard/notifications");
    };

    // 알림 타입별 컴포넌트 렌더링
    const renderNotificationItem = (notification: Notification, index: number) => {
        const commonProps = {
            notification,
            onRead: markAsRead,
        };

        switch (notification.type) {
            case NotificationType.SYSTEM_NOTICE:
                return (
                    <div key={notification.id}>
                        <SystemNotificationItem
                            {...commonProps}
                            onClick={handleNotificationClick}
                        />
                        {index < recentNotifications.length - 1 && (
                            <Separator className="mx-3" />
                        )}
                    </div>
                );
            case NotificationType.GAME_RECORD_REQUEST:
                return (
                    <div key={notification.id}>
                        <GameRecordNotificationItem
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
                        {index < recentNotifications.length - 1 && (
                            <Separator className="mx-3" />
                        )}
                    </div>
                );
            default:
                return (
                    <div key={notification.id}>
                        <NotificationItem
                            {...commonProps}
                            onClick={handleNotificationClick}
                        />
                        {index < recentNotifications.length - 1 && (
                            <Separator className="mx-3" />
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="w-80 max-w-[90vw] bg-background rounded-lg shadow-lg border border-border notification-dropdown">
            <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="text-lg font-semibold">알림</h3>
                {recentNotifications.length > 0 && (
                    <button
                        onClick={handleViewAllClick}
                        className="text-sm text-primary hover:underline"
                    >
                        전체 보기
                    </button>
                )}
            </div>

            <Separator />

            <ScrollArea className="max-h-96">
                {recentNotifications.length > 0 ? (
                    <div className="py-2">
                        {recentNotifications.map((notification, index) =>
                            renderNotificationItem(notification, index)
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <img 
                            src="/content/image/emptyNotice.png" 
                            alt="알림 없음" 
                            className="w-24 h-24 mx-auto mb-4"
                        />
                        <p className="text-muted-foreground">
                            새로운 알림이 없습니다
                        </p>
                    </div>
                )}
            </ScrollArea>

            {recentNotifications.length > 0 && (
                <>
                    <Separator />
                    <div className="p-4 pt-2">
                        <button
                            onClick={handleViewAllClick}
                            className={cn(
                                "block w-full text-center text-sm text-primary hover:underline",
                                "py-2 rounded-md hover:bg-muted/50 transition-colors"
                            )}
                        >
                            전체 보기 →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
