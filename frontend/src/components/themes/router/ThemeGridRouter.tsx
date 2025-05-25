import React from "react";
import { Theme } from "@/lib/types";
import CrimesceneThemeGrid from "../crimescene/CrimesceneThemeGrid";
import EscapeRoomThemeGrid from "@/components/escape-room/list/EscapeRoomThemeGrid";

interface ThemeGridRouterProps {
    themes: Theme[];
    isLoading: boolean;
    pageSize: number;
    category?: string;
    onCreateTheme?: () => void;
    canCreateTheme?: boolean;
}

const ThemeGridRouter: React.FC<ThemeGridRouterProps> = ({
    themes,
    isLoading,
    pageSize,
    category,
    onCreateTheme,
    canCreateTheme,
}) => {
    // 카테고리별 그리드 컴포넌트 렌더링
    switch (category) {
        case "CRIMESCENE":
        case "crimescene":
            return (
                <CrimesceneThemeGrid
                    themes={themes}
                    isLoading={isLoading}
                    pageSize={pageSize}
                />
            );

        case "ESCAPE_ROOM":
        case "escape-room":
        case "escape_room":
            // Theme 타입을 EscapeRoomTheme 타입으로 변환
            return (
                <EscapeRoomThemeGrid
                    themes={themes}
                    isLoading={isLoading}
                    pageSize={pageSize}
                    onCreateTheme={onCreateTheme}
                    canCreateTheme={canCreateTheme}
                />
            );

        case "MURDER_MYSTERY":
        case "murder-mystery":
            // TODO: 머더미스터리 그리드 구현
            return (
                <CrimesceneThemeGrid
                    themes={themes}
                    isLoading={isLoading}
                    pageSize={pageSize}
                />
            );

        case "REALWORLD":
        case "realworld":
            // TODO: 리얼월드 그리드 구현
            return (
                <CrimesceneThemeGrid
                    themes={themes}
                    isLoading={isLoading}
                    pageSize={pageSize}
                />
            );

        default:
            // 기본값으로 크라임씬 그리드 사용
            return (
                <CrimesceneThemeGrid
                    themes={themes}
                    isLoading={isLoading}
                    pageSize={pageSize}
                />
            );
    }
};

export default ThemeGridRouter;
