import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, Ghost, Info } from 'lucide-react';
import StarRating from '@/components/ui/star-rating';
import { EscapeRoomThemeDetailType } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ThemeExperienceInfoProps {
    theme: EscapeRoomThemeDetailType;
}

const ThemeExperienceInfo: React.FC<ThemeExperienceInfoProps> = ({ theme }) => {
    const hasExperienceInfo = 
        theme.horrorLevel !== undefined && theme.horrorLevel !== null ||
        theme.deviceRatio !== undefined && theme.deviceRatio !== null ||
        theme.activityLevel !== undefined && theme.activityLevel !== null;

    if (!hasExperienceInfo) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        체험 정보
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            체험 정보가 아직 등록되지 않았습니다.
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
                    <Activity className="w-5 h-5" />
                    체험 정보
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 공포도 */}
                {theme.horrorLevel !== undefined && theme.horrorLevel !== null ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Ghost className="w-5 h-5 text-purple-600" />
                            <div>
                                <div className="font-medium">공포도</div>
                                <div className="text-sm text-muted-foreground">
                                    무서운 요소의 강도
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <StarRating
                                rating={theme.horrorLevel}
                                isOneToTen={true}
                                readOnly={true}
                                size="md"
                            />
                            <span className="text-sm text-muted-foreground">
                                {theme.horrorLevel}/10
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Ghost className="w-5 h-5 text-gray-400" />
                            <div className="text-muted-foreground">공포도 정보 없음</div>
                        </div>
                    </div>
                )}

                {/* 장치비중 */}
                {theme.deviceRatio !== undefined && theme.deviceRatio !== null ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-blue-600" />
                            <div>
                                <div className="font-medium">장치비중</div>
                                <div className="text-sm text-muted-foreground">
                                    자물쇠, 기계장치 활용도
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <StarRating
                                rating={theme.deviceRatio}
                                isOneToTen={true}
                                readOnly={true}
                                size="md"
                            />
                            <span className="text-sm text-muted-foreground">
                                {theme.deviceRatio}/10
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-gray-400" />
                            <div className="text-muted-foreground">장치비중 정보 없음</div>
                        </div>
                    </div>
                )}

                {/* 활동도 */}
                {theme.activityLevel !== undefined && theme.activityLevel !== null ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-green-600" />
                            <div>
                                <div className="font-medium">활동도</div>
                                <div className="text-sm text-muted-foreground">
                                    움직임이 필요한 정도
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <StarRating
                                rating={theme.activityLevel}
                                isOneToTen={true}
                                readOnly={true}
                                size="md"
                            />
                            <span className="text-sm text-muted-foreground">
                                {theme.activityLevel}/10
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-gray-400" />
                            <div className="text-muted-foreground">활동도 정보 없음</div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ThemeExperienceInfo;
