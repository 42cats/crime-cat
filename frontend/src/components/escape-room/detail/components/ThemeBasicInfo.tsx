import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, DollarSign, Gamepad2 } from "lucide-react";
import StarRating from "@/components/ui/star-rating";
import { EscapeRoomThemeDetailType } from "@/lib/types";

interface ThemeBasicInfoProps {
    theme: EscapeRoomThemeDetailType;
}

const ThemeBasicInfo: React.FC<ThemeBasicInfoProps> = ({ theme }) => {
    const formatPrice = (amount: number): string => {
        if (amount === 0) return "무료";
        return new Intl.NumberFormat("ko-KR").format(amount) + "원";
    };

    const formatDuration = (min: number, max: number): string => {
        if (min === max) {
            return min < 60 ? `${min}분` : `${Math.floor(min / 60)}시간`;
        }

        const formatTime = (minutes: number) => {
            if (minutes < 60) return `${minutes}분`;
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0
                ? `${hours}시간 ${remainingMinutes}분`
                : `${hours}시간`;
        };

        return `${formatTime(min)} ~ ${formatTime(max)}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5" />
                    기본 정보
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* 참가 인원 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>참가 인원</span>
                        </div>
                        <div className="font-medium">
                            {theme.playersMin === theme.playersMax
                                ? `${theme.playersMin}인`
                                : `${theme.playersMin}~${theme.playersMax}인`}
                        </div>
                    </div>

                    {/* 소요 시간 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>소요 시간</span>
                        </div>
                        <div className="font-medium">
                            {formatDuration(
                                theme.playTimeMin,
                                theme.playTimeMax
                            )}
                        </div>
                    </div>

                    {/* 이용 가격 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            <span>이용 가격</span>
                        </div>
                        <div className="font-medium">
                            {formatPrice(theme.price)}
                        </div>
                    </div>

                    {/* 난이도 */}
                    <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                            난이도
                        </div>
                        <StarRating
                            rating={theme.difficulty}
                            isOneToTen={true}
                            readOnly={true}
                            size="md"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ThemeBasicInfo;
