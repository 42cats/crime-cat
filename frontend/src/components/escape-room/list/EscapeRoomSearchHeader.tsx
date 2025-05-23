import React, { useState } from 'react';
import { Search, Filter, Plus, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchFilters {
    query: string;
    difficulty: number[];
    priceRange: [number, number];
    participantRange: [number, number];
    durationRange: [number, number];
    genreTags: string[];
    location: string;
    sortBy: 'newest' | 'oldest' | 'popularity' | 'rating' | 'price_low' | 'price_high';
}

interface EscapeRoomSearchHeaderProps {
    filters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
    onCreateTheme?: () => void;
    canCreateTheme?: boolean;
    totalCount?: number;
    isLoading?: boolean;
}

const EscapeRoomSearchHeader: React.FC<EscapeRoomSearchHeaderProps> = ({
    filters,
    onFiltersChange,
    onCreateTheme,
    canCreateTheme = false,
    totalCount = 0,
    isLoading = false
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const debouncedQuery = useDebounce(filters.query, 300);

    // 디바운스된 검색어 변경 시 실제 검색 실행
    React.useEffect(() => {
        if (debouncedQuery !== filters.query) {
            onFiltersChange({ ...filters, query: debouncedQuery });
        }
    }, [debouncedQuery]);

    const handleQueryChange = (query: string) => {
        onFiltersChange({ ...filters, query });
    };

    const clearFilters = () => {
        onFiltersChange({
            query: '',
            difficulty: [],
            priceRange: [0, 100000],
            participantRange: [1, 20],
            durationRange: [15, 180],
            genreTags: [],
            location: '',
            sortBy: 'newest'
        });
        setShowFilters(false);
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.difficulty.length > 0) count++;
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) count++;
        if (filters.participantRange[0] > 1 || filters.participantRange[1] < 20) count++;
        if (filters.durationRange[0] > 15 || filters.durationRange[1] < 180) count++;
        if (filters.genreTags.length > 0) count++;
        if (filters.location) count++;
        if (filters.sortBy !== 'newest') count++;
        return count;
    };

    const activeFilterCount = getActiveFilterCount();

    return (
        <div className="space-y-4">
            {/* 상단 헤더 */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">방탈출 테마</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isLoading ? '검색 중...' : `총 ${totalCount}개의 테마`}
                    </p>
                </div>
                
                {canCreateTheme && onCreateTheme && (
                    <Button 
                        onClick={onCreateTheme}
                        className="flex items-center gap-2"
                        size="lg"
                    >
                        <Plus className="w-4 h-4" />
                        테마 등록
                    </Button>
                )}
            </div>

            {/* 검색 및 필터 바 */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* 검색 입력 */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="테마 제목, 장르, 매장명으로 검색..."
                                value={filters.query}
                                onChange={(e) => handleQueryChange(e.target.value)}
                                className="pl-10 pr-4"
                            />
                        </div>

                        {/* 필터 및 정렬 버튼들 */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 relative"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                필터
                                {activeFilterCount > 0 && (
                                    <Badge 
                                        variant="secondary" 
                                        className="ml-1 bg-blue-100 text-blue-800 text-xs"
                                    >
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>

                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    초기화
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* 활성 필터 표시 */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                            {filters.difficulty.length > 0 && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    난이도: {filters.difficulty.join(', ')}⭐
                                </Badge>
                            )}
                            {filters.genreTags.length > 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                    장르: {filters.genreTags.slice(0, 2).join(', ')}
                                    {filters.genreTags.length > 2 && ` 외 ${filters.genreTags.length - 2}개`}
                                </Badge>
                            )}
                            {filters.location && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                    지역: {filters.location}
                                </Badge>
                            )}
                            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                    가격: {filters.priceRange[0].toLocaleString()}원 - {filters.priceRange[1].toLocaleString()}원
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 상세 필터 패널 */}
            {showFilters && (
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600 mb-2">
                            상세 필터 옵션들이 여기에 표시됩니다.
                            (EscapeRoomDetailedFilters 컴포넌트로 분리 예정)
                        </div>
                        {/* TODO: 상세 필터 컴포넌트 추가 */}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default EscapeRoomSearchHeader;