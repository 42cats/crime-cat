import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, XCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EscapeRoomThemeDetailType } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ThemeOperationInfoProps {
    theme: EscapeRoomThemeDetailType;
}

const ThemeOperationInfo: React.FC<ThemeOperationInfoProps> = ({ theme }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return null;
        }
    };

    const getDaysFromOpen = (dateString?: string) => {
        if (!dateString) return null;
        try {
            const openDate = new Date(dateString);
            const today = new Date();
            const diffTime = today.getTime() - openDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) return `${Math.abs(diffDays)}일 후 오픈`;
            if (diffDays === 0) return '오늘 오픈';
            if (diffDays < 30) return `오픈 ${diffDays}일째`;
            if (diffDays < 365) return `오픈 ${Math.floor(diffDays / 30)}개월째`;
            return `오픈 ${Math.floor(diffDays / 365)}년째`;
        } catch {
            return null;
        }
    };

    const hasOperationInfo = theme.openDate || theme.isOperating !== undefined;

    if (!hasOperationInfo) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        운영 정보
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            운영 정보가 아직 등록되지 않았습니다.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    운영 정보
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 운영 상태 */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">운영 상태</span>
                    {theme.isOperating !== undefined ? (
                        theme.isOperating ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                운영중
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                <XCircle className="w-3 h-3 mr-1" />
                                운영종료
                            </Badge>
                        )
                    ) : (
                        <span className="text-sm text-muted-foreground">정보 없음</span>
                    )}
                </div>

                {/* 오픈일 */}
                {theme.openDate && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">오픈일</span>
                            <span className="text-sm">
                                {formatDate(theme.openDate)}
                            </span>
                        </div>
                        {getDaysFromOpen(theme.openDate) && (
                            <div className="text-sm text-muted-foreground text-right">
                                {getDaysFromOpen(theme.openDate)}
                            </div>
                        )}
                    </div>
                )}

                {/* 조회수 및 플레이 횟수 */}
                <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">조회수</span>
                        <span className="text-sm font-medium">
                            {theme.views.toLocaleString()}회
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">플레이 횟수</span>
                        <span className="text-sm font-medium">
                            {theme.playCount.toLocaleString()}회
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ThemeOperationInfo;
