import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Sparkles, 
    Clock, 
    X, 
    CheckCircle,
    AlertCircle,
    Coins
} from "lucide-react";
import { Notification, NotificationType } from "@/types/notification";
import { useNavigate } from "react-router-dom";

interface ThemeAdvertisementNotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

const ThemeAdvertisementNotificationItem: React.FC<ThemeAdvertisementNotificationItemProps> = ({
    notification,
    onMarkAsRead
}) => {
    const navigate = useNavigate();

    const getNotificationIcon = () => {
        switch (notification.type) {
            case NotificationType.THEME_AD_ACTIVATED:
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case NotificationType.THEME_AD_EXPIRED:
                return <Clock className="w-5 h-5 text-orange-500" />;
            case NotificationType.THEME_AD_CANCELLED:
                return <X className="w-5 h-5 text-red-500" />;
            default:
                return <Sparkles className="w-5 h-5 text-blue-500" />;
        }
    };

    const getNotificationColor = () => {
        switch (notification.type) {
            case NotificationType.THEME_AD_ACTIVATED:
                return "border-l-green-500 bg-green-50";
            case NotificationType.THEME_AD_EXPIRED:
                return "border-l-orange-500 bg-orange-50";
            case NotificationType.THEME_AD_CANCELLED:
                return "border-l-red-500 bg-red-50";
            default:
                return "border-l-blue-500 bg-blue-50";
        }
    };

    const getBadgeVariant = () => {
        switch (notification.type) {
            case NotificationType.THEME_AD_ACTIVATED:
                return "default" as const;
            case NotificationType.THEME_AD_EXPIRED:
                return "secondary" as const;
            case NotificationType.THEME_AD_CANCELLED:
                return "destructive" as const;
            default:
                return "outline" as const;
        }
    };

    const getBadgeText = () => {
        switch (notification.type) {
            case NotificationType.THEME_AD_ACTIVATED:
                return "활성화";
            case NotificationType.THEME_AD_EXPIRED:
                return "만료";
            case NotificationType.THEME_AD_CANCELLED:
                return "취소";
            default:
                return "광고";
        }
    };

    const handleClick = () => {
        onMarkAsRead(notification.id);
        navigate('/dashboard/theme-ads');
    };

    const hasRefundInfo = notification.message.includes('포인트가 환불');

    return (
        <Card className={`border-l-4 ${getNotificationColor()} hover:shadow-md transition-shadow cursor-pointer`}>
            <CardContent className="p-4" onClick={handleClick}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm text-gray-900">
                                {notification.title}
                            </h4>
                            <Badge variant={getBadgeVariant()} className="text-xs">
                                {getBadgeText()}
                            </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                        </p>
                        
                        {hasRefundInfo && (
                            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 rounded px-2 py-1 w-fit">
                                <Coins className="w-3 h-3" />
                                <span>환불 완료</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-shrink-0 text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                        }}
                    >
                        <Sparkles className="w-3 h-3 mr-1" />
                        광고 관리로 이동
                    </Button>
                    
                    {notification.status === 'UNREAD' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ThemeAdvertisementNotificationItem;