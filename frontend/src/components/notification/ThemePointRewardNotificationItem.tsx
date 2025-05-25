import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, TrendingUp } from "lucide-react";
import { Notification } from "@/types/notification";
import { UTCToKST } from "@/lib/dateFormat";
import { useNavigate } from "react-router-dom";

interface ThemePointRewardNotificationItemProps {
    notification: Notification;
    onRead: (id: string) => void;
}

export const ThemePointRewardNotificationItem: React.FC<
    ThemePointRewardNotificationItemProps
> = ({ notification, onRead }) => {
    const navigate = useNavigate();
    const isUnread = notification.status === "UNREAD";

    // 알림 데이터 파싱
    let parsedData: any = {};

    // 우선순위: data 필드 > metadata 파싱
    if (notification.data && typeof notification.data === "object") {
        // 백엔드에서 파싱된 데이터를 제공하는 경우
        parsedData = notification.data;
    } else if (notification.metadata) {
        // metadata만 있는 경우 (레거시 지원)
        if (typeof notification.metadata === "string") {
            try {
                parsedData = JSON.parse(notification.metadata);
            } catch (error) {
                console.error("Failed to parse metadata:", error);
            }
        } else if (typeof notification.metadata === "object") {
            parsedData = notification.metadata;
        }
    }

    const themeId = parsedData.themeId;
    const themeName = parsedData.themeName || "테마";
    const themeType = parsedData.themeType || "테마";
    const points = parsedData.points || 0;

    const handleClick = () => {
        if (isUnread) {
            onRead(notification.id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card
                className={`cursor-pointer transition-all hover:shadow-md ${
                    isUnread ? "border-primary bg-primary/5" : ""
                }`}
                onClick={handleClick}
            >
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Gift className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm">
                                    {notification.title}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                    포인트
                                </Badge>
                                {isUnread && (
                                    <Badge
                                        variant="default"
                                        className="text-xs"
                                    >
                                        NEW
                                    </Badge>
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <span className="text-muted-foreground">
                                    <UTCToKST date={notification.createdAt} />
                                </span>
                                <div className="flex items-center gap-1 text-green-600 font-medium">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>+{points.toLocaleString()}P</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
