import React from 'react';
import { MapPin, Phone, ExternalLink, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EscapeRoomLocation } from '@/lib/types';

interface LocationCardProps {
    location: EscapeRoomLocation;
    onRemove: () => void;
    disabled?: boolean;
    showCoordinates?: boolean;
}

const LocationCard: React.FC<LocationCardProps> = ({
    location,
    onRemove,
    disabled = false,
    showCoordinates = false
}) => {
    const formatCoordinates = (lat: number, lng: number) => {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    };

    // 구글 지도에서 보기
    const openInGoogleMaps = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
        window.open(url, '_blank');
    };

    return (
        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
            <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                        {/* 매장명 */}
                        <h4 className="font-medium text-sm mb-2 truncate">
                            {location.storeName}
                        </h4>

                        {/* 주소 정보 */}
                        <div className="space-y-1">
                            <div className="flex items-start gap-1 text-xs text-gray-600">
                                <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span className="break-words line-clamp-2">
                                    {location.address}
                                </span>
                            </div>

                            {/* 도로명주소 (다른 경우에만) */}
                            {location.roadAddress && 
                             location.roadAddress !== location.address && (
                                <div className="text-xs text-gray-500 ml-4 break-words line-clamp-1">
                                    {location.roadAddress}
                                </div>
                            )}
                        </div>

                        {/* 좌표 (필요시) */}
                        {showCoordinates && (
                            <div className="text-xs text-gray-500 mt-1">
                                좌표: {formatCoordinates(location.lat, location.lng)}
                            </div>
                        )}

                        {/* 추가 정보 */}
                        <div className="flex items-center gap-3 mt-2">
                            {/* 전화번호 */}
                            {location.phone && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Phone className="w-3 h-3" />
                                    <span>{location.phone}</span>
                                </div>
                            )}

                            {/* 구글 지도 보기 */}
                            <button
                                onClick={openInGoogleMaps}
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                <Navigation className="w-3 h-3" />
                                지도
                            </button>

                            {/* 네이버 링크 */}
                            {location.link && (
                                <a
                                    href={location.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    네이버
                                </a>
                            )}
                        </div>

                        {/* 매장 설명 */}
                        {location.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                {location.description}
                            </p>
                        )}
                    </div>

                    {/* 삭제 버튼 */}
                    {!disabled && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onRemove}
                            className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default LocationCard;