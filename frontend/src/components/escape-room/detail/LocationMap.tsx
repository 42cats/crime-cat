import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ExternalLink } from 'lucide-react';
import { EscapeRoomLocation } from '@/lib/types';

interface LocationMapProps {
    locations: EscapeRoomLocation[];
    height?: number;
    showControls?: boolean;
}

declare global {
    interface Window {
        naver: any;
    }
}

const LocationMap: React.FC<LocationMapProps> = ({
    locations,
    height = 300,
    showControls = true
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        // 네이버 지도 스크립트가 로드되지 않은 경우 대기
        if (!window.naver || !window.naver.maps) {
            console.warn('Naver Maps API not loaded');
            return;
        }

        if (!mapRef.current || locations.length === 0) {
            return;
        }

        // 첫 번째 위치를 중심으로 설정
        const centerLocation = locations[0];
        const center = new window.naver.maps.LatLng(
            parseFloat(centerLocation.y), 
            parseFloat(centerLocation.x)
        );

        // 지도 생성
        const map = new window.naver.maps.Map(mapRef.current, {
            center: center,
            zoom: locations.length === 1 ? 16 : 13,
            minZoom: 7,
            maxZoom: 21,
            zoomControl: showControls,
            zoomControlOptions: {
                position: window.naver.maps.Position.TOP_RIGHT
            },
            scaleControl: showControls,
            logoControl: true,
            mapDataControl: showControls,
            mapTypeControl: showControls && locations.length > 1,
            // 지도 상호작용 설정
            draggable: true,
            pinchZoom: true,
            scrollWheel: true,
            keyboardShortcuts: true,
            disableDoubleTapZoom: false,
            disableDoubleClickZoom: false,
            disableTwoFingerTapZoom: false
        });

        // 마커들 추가
        const markers: any[] = [];
        const infoWindows: any[] = [];

        locations.forEach((location, index) => {
            const position = new window.naver.maps.LatLng(
                parseFloat(location.y),
                parseFloat(location.x)
            );

            // 마커 생성
            const marker = new window.naver.maps.Marker({
                position: position,
                map: map,
                title: location.name,
                icon: {
                    content: `
                        <div style="
                            background: #3b82f6; 
                            color: white; 
                            padding: 4px 8px; 
                            border-radius: 12px; 
                            font-size: 12px; 
                            font-weight: bold;
                            border: 2px solid white;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                            white-space: nowrap;
                        ">
                            ${index + 1}
                        </div>
                    `,
                    size: new window.naver.maps.Size(40, 40),
                    anchor: new window.naver.maps.Point(20, 40)
                }
            });

            // 정보창 생성
            const infoWindow = new window.naver.maps.InfoWindow({
                content: `
                    <div style="
                        padding: 12px; 
                        max-width: 250px; 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.4;
                    ">
                        <div style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">
                            ${location.name}
                        </div>
                        <div style="color: #6b7280; font-size: 13px; margin-bottom: 6px;">
                            📍 ${location.roadAddress}
                        </div>
                        ${location.phone ? `
                            <div style="color: #6b7280; font-size: 13px; margin-bottom: 8px;">
                                📞 ${location.phone}
                            </div>
                        ` : ''}
                        <div style="text-align: center;">
                            <button 
                                onclick="window.open('https://map.naver.com/v5/search/${encodeURIComponent(location.name + ' ' + location.roadAddress)}', '_blank')"
                                style="
                                    background: #22c55e; 
                                    color: white; 
                                    border: none; 
                                    padding: 6px 12px; 
                                    border-radius: 4px; 
                                    font-size: 12px; 
                                    cursor: pointer;
                                    margin-right: 4px;
                                "
                            >
                                🗺️ 네이버 지도
                            </button>
                            <button 
                                onclick="window.open('https://map.naver.com/v5/directions/car?c=${location.x},${location.y},18,0,0,0,dh', '_blank')"
                                style="
                                    background: #3b82f6; 
                                    color: white; 
                                    border: none; 
                                    padding: 6px 12px; 
                                    border-radius: 4px; 
                                    font-size: 12px; 
                                    cursor: pointer;
                                "
                            >
                                🚗 길찾기
                            </button>
                        </div>
                    </div>
                `,
                borderWidth: 0,
                backgroundColor: 'transparent'
            });

            // 마커 클릭 이벤트
            window.naver.maps.Event.addListener(marker, 'click', () => {
                // 다른 정보창들 닫기
                infoWindows.forEach(iw => iw.close());
                // 현재 정보창 열기
                infoWindow.open(map, marker);
            });

            markers.push(marker);
            infoWindows.push(infoWindow);
        });

        // 여러 위치가 있는 경우 모든 마커가 보이도록 지도 조정
        if (locations.length > 1) {
            const bounds = new window.naver.maps.LatLngBounds();
            locations.forEach(location => {
                bounds.extend(new window.naver.maps.LatLng(
                    parseFloat(location.y),
                    parseFloat(location.x)
                ));
            });
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }

        mapInstanceRef.current = map;

        // 정리 함수
        return () => {
            markers.forEach(marker => marker.setMap(null));
            infoWindows.forEach(infoWindow => infoWindow.close());
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
        };
    }, [locations, height, showControls]);

    if (locations.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="text-center py-8">
                    <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                        등록된 매장 위치가 없습니다
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {/* 지도 */}
            <div 
                ref={mapRef} 
                style={{ height: `${height}px` }}
                className="w-full rounded-lg border border-gray-200 overflow-hidden"
            />
            
            {/* 매장 목록 */}
            <div className="space-y-2">
                {locations.map((location, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                {index + 1}
                            </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {location.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {location.roadAddress}
                            </p>
                        </div>
                        <button
                            onClick={() => window.open(
                                `https://map.naver.com/v5/search/${encodeURIComponent(location.name + ' ' + location.roadAddress)}`,
                                '_blank'
                            )}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="네이버 지도에서 보기"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            
            {!window.naver && (
                <div className="text-center py-4">
                    <p className="text-xs text-gray-500">
                        네이버 지도 API를 로드하는 중입니다...
                    </p>
                </div>
            )}
        </div>
    );
};

export default LocationMap;