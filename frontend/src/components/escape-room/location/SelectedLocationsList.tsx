import React from 'react';
import { MapPin, Phone, ExternalLink, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EscapeRoomLocation } from '@/lib/types';

interface SelectedLocationsListProps {
    locations: EscapeRoomLocation[];
    onLocationRemove: (index: number) => void;
    maxLocations: number;
    onSave: () => void;
}

const SelectedLocationsList: React.FC<SelectedLocationsListProps> = ({
    locations,
    onLocationRemove,
    maxLocations,
    onSave
}) => {
    const formatCoordinates = (lat: number, lng: number) => {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        선택된 매장
                    </span>
                    <Badge variant="outline">
                        {locations.length}/{maxLocations}
                    </Badge>
                </CardTitle>
                {locations.length === 0 && (
                    <p className="text-sm text-gray-500">
                        최소 1개 이상의 매장을 등록해야 합니다.
                    </p>
                )}
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
                {locations.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <MapPin className="w-8 h-8 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-500">
                                검색 결과에서 매장을 선택하세요
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 mb-4">
                            <div className="space-y-3">
                                {locations.map((location, index) => (
                                    <Card key={index} className="border border-gray-200">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    {/* 매장명 */}
                                                    <h4 className="font-medium text-sm mb-2">
                                                        {location.storeName}
                                                    </h4>

                                                    {/* 주소 */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-start gap-1 text-xs text-gray-600">
                                                            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                                            <span className="break-words">
                                                                {location.address}
                                                            </span>
                                                        </div>

                                                        {/* 도로명주소 */}
                                                        {location.roadAddress && 
                                                         location.roadAddress !== location.address && (
                                                            <div className="text-xs text-gray-500 ml-4 break-words">
                                                                {location.roadAddress}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 좌표 */}
                                                    <div className="text-xs text-gray-500 mt-2">
                                                        좌표: {formatCoordinates(location.lat, location.lng)}
                                                    </div>

                                                    {/* 전화번호 */}
                                                    {location.phone && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{location.phone}</span>
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
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                                네이버에서 보기
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 삭제 버튼 */}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onLocationRemove(index)}
                                                    className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* 저장 버튼 */}
                        <div className="border-t pt-4">
                            <Button 
                                onClick={onSave}
                                className="w-full"
                                disabled={locations.length === 0}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {locations.length}개 매장 등록 완료
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default SelectedLocationsList;