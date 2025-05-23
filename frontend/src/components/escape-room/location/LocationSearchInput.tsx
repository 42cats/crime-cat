import React, { useState, useCallback } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { naverMapService } from '@/api/external';
import { useDebounce } from '@/hooks/useDebounce';

interface LocationSearchInputProps {
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onSearch: (results: any[]) => void;
    onSearchingChange: (isSearching: boolean) => void;
}

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
    searchQuery,
    onSearchQueryChange,
    onSearch,
    onSearchingChange
}) => {
    const [error, setError] = useState<string | null>(null);

    // 디바운스된 검색
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            onSearch([]);
            return;
        }

        onSearchingChange(true);
        setError(null);

        try {
            const results = await naverMapService.searchLocal(query);
            
            if (results && results.length > 0) {
                onSearch(results);
            } else {
                onSearch([]);
                setError('검색 결과가 없습니다.');
            }
        } catch (error) {
            console.error('장소 검색 실패:', error);
            setError('검색 중 오류가 발생했습니다.');
            onSearch([]);
        } finally {
            onSearchingChange(false);
        }
    }, [onSearch, onSearchingChange]);

    // 디바운스된 검색 실행
    React.useEffect(() => {
        performSearch(debouncedSearchQuery);
    }, [debouncedSearchQuery, performSearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onSearchQueryChange(value);
        setError(null);
    };

    const handleManualSearch = () => {
        performSearch(searchQuery);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(searchQuery);
        }
    };

    return (
        <div className="space-y-3">
            <div>
                <Label htmlFor="location-search" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    매장 검색
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                    매장명, 주소, 브랜드명 등으로 검색하세요
                </p>
            </div>

            <div className="flex gap-2">
                <Input
                    id="location-search"
                    placeholder="예: 롯데월드 어드벤처 홍대점"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                />
                <Button 
                    onClick={handleManualSearch}
                    disabled={!searchQuery.trim()}
                    size="icon"
                >
                    <Search className="w-4 h-4" />
                </Button>
            </div>

            {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {error}
                </p>
            )}
        </div>
    );
};

export default LocationSearchInput;