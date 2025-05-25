import React from 'react';
import { MapPin, Phone, ExternalLink, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EscapeRoomLocation } from '@/lib/types';

interface LocationSearchResultsProps {
    results: any[];
    isSearching: boolean;
    onLocationSelect: (location: any) => void;
    selectedLocations: EscapeRoomLocation[];
}

const LocationSearchResults: React.FC<LocationSearchResultsProps> = ({
    results,
    isSearching,
    onLocationSelect,
    selectedLocations
}) => {
    // 이미 선택된 위치인지 확인
    const isLocationSelected = (location: any) => {
        const storeName = location.title.replace(/<[^>]+>/g, '');
        return selectedLocations.some(
            selected => selected.storeName === storeName && 
                       selected.address === location.address
        );
    };

    // 카테고리 배지 색상 결정
    const getCategoryColor = (category: string) => {
        if (category.includes('오락')) return 'bg-purple-100 text-purple-700';
        if (category.includes('게임')) return 'bg-blue-100 text-blue-700';
        if (category.includes('체험')) return 'bg-green-100 text-green-700';
        return 'bg-gray-100 text-gray-700';
    };

    if (isSearching) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-gray-500">검색 중...</p>
                </div>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                    <MapPin className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500">
                        매장명을 검색해보세요
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">검색 결과</h3>
                <Badge variant="outline">{results.length}개 찾음</Badge>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-2">
                    {results.map((location, index) => {
                        const isSelected = isLocationSelected(location);
                        const storeName = location.title.replace(/<[^>]+>/g, '');
                        
                        return (
                            <Card 
                                key={index} 
                                className={`cursor-pointer transition-all ${
                                    isSelected 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'hover:border-blue-300 hover:shadow-sm'
                                }`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* 매장명과 카테고리 */}
                                            <div className="flex items-start gap-2 mb-2">
                                                <h4 className="font-medium text-sm leading-5 truncate">
                                                    {storeName}
                                                </h4>
                                                {location.category && (
                                                    <Badge 
                                                        className={`text-xs ${getCategoryColor(location.category)}`}
                                                        variant="secondary"
                                                    >
                                                        {location.category.split('>').pop()?.trim()}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* 주소 */}
                                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{location.address}</span>
                                            </div>

                                            {/* 도로명주소 */}
                                            {location.roadAddress && location.roadAddress !== location.address && (
                                                <div className="text-xs text-gray-500 ml-4 truncate">
                                                    {location.roadAddress}
                                                </div>
                                            )}

                                            {/* 전화번호 */}
                                            {location.telephone && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                                    <Phone className="w-3 h-3" />
                                                    <span>{location.telephone}</span>
                                                </div>
                                            )}

                                            {/* 네이버 링크 */}
                                            {location.link && (
                                                <div className="mt-2">
                                                    <a
                                                        href={location.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        네이버에서 보기
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* 선택 버튼 */}
                                        <Button
                                            size="sm"
                                            variant={isSelected ? "default" : "outline"}
                                            onClick={() => !isSelected && onLocationSelect(location)}
                                            disabled={isSelected}
                                            className="flex-shrink-0"
                                        >
                                            {isSelected ? (
                                                <>
                                                    <Check className="w-3 h-3 mr-1" />
                                                    선택됨
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    추가
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};

export default LocationSearchResults;