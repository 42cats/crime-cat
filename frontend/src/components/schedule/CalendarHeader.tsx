import React from "react";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./common/LoadingSpinner";

interface CalendarHeaderProps {
    viewMode: "compact" | "standard" | "expanded";
    calendarSizes: {
        iconSize: string;
        headerSize: string;
        fontSize: string;
    };
    isLoading: boolean;
    error: string | null;
    isMobile: boolean;
    onRefresh: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    viewMode,
    calendarSizes,
    isLoading,
    error,
    isMobile,
    onRefresh,
}) => {
    return (
        <div className="flex flex-col gap-4">
            {/* 제목 및 컨트롤 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle
                    className={cn(
                        "flex items-center gap-2",
                        calendarSizes.headerSize
                    )}
                >
                    <CalendarIcon
                        className={cn(
                            calendarSizes.iconSize === "w-2.5 h-2.5"
                                ? "w-4 h-4"
                                : calendarSizes.iconSize === "w-3 h-3"
                                ? "w-5 h-5"
                                : "w-6 h-6"
                        )}
                    />
                    개인 캘린더
                </CardTitle>

                <div className="flex items-center gap-3">
                    {/* 새로고침 버튼 및 에러 표시 */}
                    {error ? (
                        <div className="flex items-center gap-2">
                            <div className="text-destructive text-sm font-medium">
                                {!isMobile && "데이터 로드 실패"}
                                <span className="text-xs ml-1">⚠️</span>
                            </div>
                            <Button
                                variant="destructive"
                                size={isMobile ? "sm" : "default"}
                                onClick={onRefresh}
                                className="h-8"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {!isMobile && <span className="ml-1">재시도</span>}
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <LoadingSpinner
                            size="sm"
                            text={!isMobile ? "로딩 중..." : undefined}
                            className="text-muted-foreground"
                        />
                    ) : (
                        <Button
                            variant="ghost"
                            size={isMobile ? "sm" : "default"}
                            onClick={onRefresh}
                            className="flex items-center gap-1"
                            disabled={isLoading}
                        >
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                            {!isMobile && (isLoading ? "새로고침 중..." : "새로고침")}
                        </Button>
                    )}
                </div>
            </div>

        </div>
    );
};

export default CalendarHeader;