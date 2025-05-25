import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { themesService } from "@/api/content/themesService";
import { Theme } from "@/lib/types";
import { useDebounce } from "@/hooks/useDebounce";

interface ThemeSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (theme: Theme) => void;
    selectedThemeType?: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD";
}

const ThemeSearchModal: React.FC<ThemeSearchModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    selectedThemeType = "CRIMESCENE",
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState(selectedThemeType);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // 테마 타입별 API 함수 매핑
    const themeAPIs = {
        CRIMESCENE: themesService.getCrimesceneThemes,
        ESCAPE_ROOM: themesService.getEscapeRoomThemesSimple,
        MURDER_MYSTERY: null, // 아직 구현되지 않음
        REALWORLD: null, // 아직 구현되지 않음
    };

    const { data: themes = [], isLoading } = useQuery({
        queryKey: ["themes-search", selectedType, debouncedSearchQuery],
        queryFn: async () => {
            const apiFunction = themeAPIs[selectedType];
            if (!apiFunction) {
                return [];
            }
            
            const allThemes = await apiFunction();
            
            // 검색어로 필터링
            if (debouncedSearchQuery) {
                return allThemes.filter(
                    (theme: Theme) =>
                        theme.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                        theme.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                        (theme.author && theme.author.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
                );
            }
            
            return allThemes;
        },
        enabled: isOpen && !!themeAPIs[selectedType],
    });

    // 모달이 닫힐 때 검색어 초기화
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
        }
    }, [isOpen]);

    const handleThemeSelect = (theme: Theme) => {
        onSelect(theme);
        onClose();
    };

    const themeTypeLabels = {
        CRIMESCENE: "크라임씬",
        ESCAPE_ROOM: "방탈출",
        MURDER_MYSTERY: "머더미스터리",
        REALWORLD: "리얼월드",
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>테마 검색</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* 검색 입력 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="테마 ID 또는 제목으로 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* 테마 타입 탭 */}
                    <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
                        <TabsList className="grid w-full grid-cols-4">
                            {Object.entries(themeTypeLabels).map(([value, label]) => (
                                <TabsTrigger 
                                    key={value} 
                                    value={value}
                                    disabled={!themeAPIs[value as keyof typeof themeAPIs]}
                                >
                                    {label}
                                    {!themeAPIs[value as keyof typeof themeAPIs] && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                            준비중
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value={selectedType} className="mt-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : themes.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {debouncedSearchQuery
                                        ? "검색 결과가 없습니다."
                                        : "등록된 테마가 없습니다."}
                                </div>
                            ) : (
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-2">
                                        {themes.map((theme: Theme) => (
                                            <div
                                                key={theme.id}
                                                className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                                onClick={() => handleThemeSelect(theme)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium">{theme.title}</h4>
                                                        <div className="mt-1 space-y-1">
                                                            <p className="text-sm text-muted-foreground">
                                                                제작: {theme.author}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                ID: {theme.id}
                                                            </p>
                                                        </div>
                                                        <div className="mt-2 flex gap-2 flex-wrap">
                                                            <Badge variant="outline" className="text-xs">
                                                                {theme.players}명
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs">
                                                                {theme.playtime}
                                                            </Badge>
                                                            {theme.price && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {theme.price}원
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {theme.thumbnail && (
                                                        <img
                                                            src={theme.thumbnail}
                                                            alt={theme.title}
                                                            className="w-20 h-20 object-cover rounded ml-4"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ThemeSearchModal;
