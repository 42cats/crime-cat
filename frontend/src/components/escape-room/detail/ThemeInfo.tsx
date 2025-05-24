import React from "react";
import { EscapeRoomThemeDetailType } from "@/lib/types";
import ThemeBasicInfo from "./components/ThemeBasicInfo";
import ThemeExperienceInfo from "./components/ThemeExperienceInfo";
import ThemeOperationInfo from "./components/ThemeOperationInfo";
import ThemeContent from "./components/ThemeContent";

interface ThemeInfoProps {
    theme: EscapeRoomThemeDetailType;
}

const ThemeInfo: React.FC<ThemeInfoProps> = ({ theme }) => {
    return (
        <div className="space-y-6">
            {/* 기본 정보 */}
            <ThemeBasicInfo theme={theme} />

            {/* 체험 정보와 운영 정보를 가로로 배치 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ThemeExperienceInfo theme={theme} />
                <ThemeOperationInfo theme={theme} />
            </div>
            {/* 본문 내용 */}
            <ThemeContent theme={theme} />
        </div>
    );
};

export default ThemeInfo;
