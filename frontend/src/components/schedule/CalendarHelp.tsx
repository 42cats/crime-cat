import React from "react";
import { cn } from "@/lib/utils";

interface CalendarHelpProps {
    allowBlocking: boolean;
    isMobile: boolean;
    viewMode: "compact" | "standard" | "expanded";
    calendarSizes: {
        fontSize: string;
    };
}

const CalendarHelp: React.FC<CalendarHelpProps> = ({
    allowBlocking,
    isMobile,
    viewMode,
    calendarSizes,
}) => {
    if (!allowBlocking) return null;

    // 데스크톱 전체 도움말 (컴팩트 모드가 아닐 때만)
    if (!isMobile && viewMode !== "compact") {
        return (
            <div
                className={cn(
                    "text-muted-foreground space-y-1 pt-2 border-t",
                    calendarSizes.fontSize
                )}
            >
                <p>
                    💡 <strong>사용법:</strong>
                </p>
                <p>• 단일 날짜: 클릭하여 비활성화/활성화 토글</p>
                <p>
                    • 날짜 범위: 드래그하여 범위 선택 후 일괄 비활성화
                </p>
                <p>
                    • 과거 날짜와 기존 일정이 있는 날짜는 수정할 수
                    없습니다
                </p>
            </div>
        );
    }

    // 모바일 전용 간단 도움말
    if (isMobile) {
        return (
            <div
                className={cn(
                    "text-muted-foreground pt-2 border-t text-center",
                    calendarSizes.fontSize
                )}
            >
                <p>💡 탭하여 날짜 상태 변경, 드래그하여 범위 선택</p>
            </div>
        );
    }

    // 컴팩트 모드 전용 간단 도움말 (데스크톱)
    if (viewMode === "compact") {
        return (
            <div
                className={cn(
                    "text-muted-foreground pt-2 border-t text-center",
                    calendarSizes.fontSize
                )}
            >
                <p>💡 클릭/드래그로 날짜 관리</p>
            </div>
        );
    }

    return null;
};

export default CalendarHelp;