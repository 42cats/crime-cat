import React from "react";
import { useNavigate } from "react-router-dom";
import { NotificationItem } from "@/components/NotificationItem";
import { useNotification } from "@/hooks/useNotification";
import { handleNotificationRouting } from "@/utils/notificationRouting";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Notification } from "@/types/notification";

interface NotificationDropdownProps {
    onClose?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    onClose,
}) => {
    const { recentNotifications, markAsRead } = useNotification();
    const navigate = useNavigate();

    // 알림 클릭 처리를 위한 함수
    const handleNotificationClick = (notification: Notification) => {
        handleNotificationRouting.navigateFromDropdown(
            notification,
            navigate,
            onClose!
        );
    };

    // 전체 보기 버튼 클릭 처리
    const handleViewAllClick = (e: React.MouseEvent) => {
        console.log("전체 보기 클릭됨");
        if (onClose) {
            onClose();
        }
        navigate("/notifications");
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
                        {recentNotifications.map((notification, index) => (
                            <React.Fragment key={notification.id}>
                                <NotificationItem
                                    notification={notification}
                                    onRead={markAsRead}
                                    onClick={handleNotificationClick}
                                />
                                {index < recentNotifications.length - 1 && (
                                    <Separator className="mx-3" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="text-6xl mb-4">📭</div>
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
