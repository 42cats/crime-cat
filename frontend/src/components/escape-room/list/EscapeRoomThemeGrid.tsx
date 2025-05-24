import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Plus } from "lucide-react";
import EscapeRoomThemeCard from "./EscapeRoomThemeCard";
import { EscapeRoomTheme } from "@/lib/types";

interface EscapeRoomThemeGridProps {
    themes: EscapeRoomTheme[];
    isLoading: boolean;
    pageSize: number;
    onCreateTheme?: () => void;
    canCreateTheme?: boolean;
}

const EscapeRoomThemeGrid: React.FC<EscapeRoomThemeGridProps> = ({
    themes,
    isLoading,
    pageSize,
    onCreateTheme,
    canCreateTheme = false,
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: pageSize }).map((_, i) => (
                    <Skeleton key={i} className="h-[450px] rounded-xl" />
                ))}
            </div>
        );
    }

    if (themes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                    등록된 방탈출 테마가 없습니다
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md">
                    아직 등록된 방탈출 테마가 없습니다.
                    {canCreateTheme
                        ? " 첫 번째 테마를 등록해보세요!"
                        : " 곧 다양한 테마들이 추가될 예정입니다."}
                </p>
                {canCreateTheme && onCreateTheme && (
                    <button
                        onClick={onCreateTheme}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />첫 번째 테마 등록하기
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* 테마 카드들 */}
            {themes.map((theme, index) => (
                <EscapeRoomThemeCard
                    key={theme.id}
                    theme={theme}
                    index={index}
                />
            ))}
        </div>
    );
};

export default EscapeRoomThemeGrid;
