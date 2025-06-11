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
    onClick?: (notification: Notification) => void;
}

const ThemeAdvertisementNotificationItem: React.FC<ThemeAdvertisementNotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onClick
}) => {
    const navigate = useNavigate();

    // 메타데이터에서 정보 추출
    const getNotificationData = () => {
        try {
            // notification.data가 있으면 사용, 없으면 metadata를 파싱
            const data = notification.data || (notification.metadata ? JSON.parse(notification.metadata) : {});
            return {
                themeName: data.themeName || '테마',
                themeType: data.themeType || '',
                refundAmount: data.refundAmount || 0,
                reason: data.reason || ''
            };
        } catch (error) {
            console.error('알림 메타데이터 파싱 실패:', error);
            return {
                themeName: '테마',
                themeType: '',
                refundAmount: 0,
                reason: ''
            };
        }
    };

    const notificationData = getNotificationData();

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
        if (notification.status === 'UNREAD') {
            onMarkAsRead(notification.id);
        }
        if (onClick) {
            onClick(notification);
        } else {
            navigate('/dashboard/theme-ads');
        }
    };

    // 메타데이터를 기반으로 동적 제목과 메시지 생성
    const getDisplayTitle = () => {
        const { themeName, themeType } = notificationData;
        const typeLabel = themeType === 'CRIMESCENE' ? '크라임씬' : 
                         themeType === 'ESCAPE_ROOM' ? '방탈출' : '테마';
        
        switch (notification.type) {
            case NotificationType.THEME_AD_ACTIVATED:
                return `${typeLabel} 광고 활성화`;
            case NotificationType.THEME_AD_EXPIRED:
                return `${typeLabel} 광고 만료`;
            case NotificationType.THEME_AD_CANCELLED:
                return `${typeLabel} 광고 취소`;
            default:
                return notification.title || '테마 광고 알림';
        }
    };

    const getDisplayMessage = () => {
        const { themeName, refundAmount, reason } = notificationData;
        
        switch (notification.type) {
            case NotificationType.THEME_AD_ACTIVATED:
                return `"${themeName}" 테마의 광고가 활성화되었습니다.`;
            case NotificationType.THEME_AD_EXPIRED:
                return `"${themeName}" 테마의 광고가 만료되었습니다.`;
            case NotificationType.THEME_AD_CANCELLED:
                const refundText = refundAmount > 0 ? ` ${refundAmount.toLocaleString()}P가 환불되었습니다.` : '';
                const reasonText = reason ? ` (사유: ${reason})` : '';
                return `"${themeName}" 테마의 광고가 취소되었습니다.${refundText}${reasonText}`;
            default:
                return notification.message || '테마 광고와 관련된 업데이트가 있습니다.';
        }
    };

    const hasRefundInfo = notificationData.refundAmount > 0;

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
                                {getDisplayTitle()}
                            </h4>
                            <Badge variant={getBadgeVariant()} className="text-xs">
                                {getBadgeText()}
                            </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                            {getDisplayMessage()}
                        </p>
                        
                        {hasRefundInfo && (
                            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 rounded px-2 py-1 w-fit">
                                <Coins className="w-3 h-3" />
                                <span>환불 완료: {notificationData.refundAmount.toLocaleString()}P</span>
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