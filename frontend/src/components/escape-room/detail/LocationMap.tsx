import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, AlertCircle } from "lucide-react";
import { EscapeRoomLocation } from "@/lib/types";

interface LocationMapProps {
    locations: EscapeRoomLocation[];
    height?: number;
    showControls?: boolean;
}

declare global {
    interface Window {
        naver: any;
        initNaverMap?: () => void;
        navermap_authFailure?: () => void;
    }
}

// 환경 변수에서 Client ID 가져오기
const NAVER_MAP_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_SCRIPT_ID || "";
const NAVER_MAP_SCRIPT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_KEY || "";
const LocationMap: React.FC<LocationMapProps> = ({
    locations,
    height = 300,
    showControls = true,
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const infoWindowsRef = useRef<any[]>([]);
    const [isMapReady, setIsMapReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // 1) 스크립트 로드 & 초기화
    useEffect(() => {
        // 이미 로드되어 있으면 재사용
        if (window.naver && window.naver.maps) {
            setIsMapReady(true);
            return;
        }

        // 이미 스크립트가 로딩 중이면 대기
        const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID);
        if (existingScript) {
            // 로드 완료 대기
            const checkInterval = setInterval(() => {
                if (window.naver && window.naver.maps) {
                    clearInterval(checkInterval);
                    setIsMapReady(true);
                }
            }, 100);

            return () => clearInterval(checkInterval);
        }

        // 새로 스크립트 로드
        const script = document.createElement("script");
        script.id = NAVER_MAP_SCRIPT_ID;
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
        script.async = true;
        script.defer = true;

        // 성공 콜백
        const handleLoad = () => {
            if (window.naver && window.naver.maps) {
                console.log("네이버 지도 API 로드 성공");
                setIsMapReady(true);
                setLoadError(null);
            }
        };

        // 인증 실패 콜백
        window.navermap_authFailure = () => {
            console.error("네이버 지도 API 인증 실패");
            setLoadError(
                "네이버 지도 API 인증에 실패했습니다. 관리자에게 문의해주세요."
            );
            setIsMapReady(false);
        };

        script.addEventListener("load", handleLoad);

        // 스크립트 로드 에러 처리
        script.onerror = () => {
            console.error("네이버 지도 스크립트 로드 실패");
            setLoadError(
                "네이버 지도를 불러올 수 없습니다. 네트워크 연결을 확인해주세요."
            );
            setIsMapReady(false);
        };

        document.head.appendChild(script);

        // Cleanup
        return () => {
            script.removeEventListener("load", handleLoad);
            delete window.navermap_authFailure;
        };
    }, []);

    // 2) 지도 생성 및 마커 표시
    useEffect(() => {
        if (
            !isMapReady ||
            !mapRef.current ||
            locations.length === 0 ||
            loadError
        )
            return;

        try {
            const { maps } = window.naver;

            // 지도 중심점 계산
            const centerLoc = locations[0];

            // 지도 생성
            const mapOptions = {
                center: new maps.LatLng(centerLoc.lat, centerLoc.lng),
                zoom: locations.length === 1 ? 16 : 14,
                minZoom: 8,
                maxZoom: 19,
                zoomControl: showControls,
                zoomControlOptions: showControls
                    ? {
                          position: maps.Position.TOP_RIGHT,
                          style: maps.ZoomControlStyle.SMALL,
                      }
                    : undefined,
                scaleControl: showControls,
                logoControl: true,
                logoControlOptions: {
                    position: maps.Position.BOTTOM_LEFT,
                },
                mapDataControl: showControls,
                mapTypeControl: showControls && locations.length > 1,
                draggable: true,
                pinchZoom: true,
                scrollWheel: true,
                keyboardShortcuts: false,
                tileDuration: 200,
                background: "#ffffff",
            };

            const map = new maps.Map(mapRef.current, mapOptions);
            mapInstanceRef.current = map;

            // 기존 마커와 인포윈도우 정리
            markersRef.current.forEach((marker) => {
                marker.setMap(null);
            });
            markersRef.current = [];

            infoWindowsRef.current.forEach((iw) => {
                try {
                    iw.setMap(null);
                } catch (e) {
                    console.warn("InfoWindow cleanup error:", e);
                }
            });
            infoWindowsRef.current = [];

            // 마커 및 인포윈도우 생성
            locations.forEach((loc, idx) => {
                const position = new maps.LatLng(loc.lat, loc.lng);

                // 마커 생성
                const marker = new maps.Marker({
                    position,
                    map,
                    title: loc.storeName,
                    animation: maps.Animation.DROP,
                    clickable: true,
                });

                markersRef.current.push(marker);

                // 인포윈도우 내용
                const infoContent = `
                    <div style="padding: 16px; min-width: 280px; max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
                            ${loc.storeName}
                        </h3>
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; align-items: start; gap: 8px; margin-bottom: 4px;">
                                <span style="color: #6B7280; font-size: 14px; flex-shrink: 0;">📍</span>
                                <span style="color: #4B5563; font-size: 14px; line-height: 1.4;">
                                    ${loc.roadAddress || loc.address}
                                </span>
                            </div>
                            ${
                                loc.phone
                                    ? `
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #6B7280; font-size: 14px;">📞</span>
                                    <a href="tel:${loc.phone}" style="color: #2563EB; font-size: 14px; text-decoration: none;">
                                        ${loc.phone}
                                    </a>
                                </div>
                            `
                                    : ""
                            }
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 12px;">
                            <button onclick="window.open('https://map.naver.com/p/search/${encodeURIComponent(
                                loc.storeName
                            )}', '_blank')" 
                                style="flex: 1; padding: 8px 12px; background: #03C75A; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500;">
                                네이버 지도
                            </button>
                            <button onclick="window.open('https://map.naver.com/index.nhn?elng=${
                                loc.lng
                            }&elat=${loc.lat}&etext=${encodeURIComponent(
                    loc.storeName
                )}&menu=route', '_blank')"
                                style="flex: 1; padding: 8px 12px; background: #0068C3; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500;">
                                길찾기
                            </button>
                        </div>
                    </div>
                `;

                // 인포윈도우 생성
                const infoWindow = new maps.InfoWindow({
                    content: infoContent,
                    maxWidth: 320,
                    backgroundColor: "white",
                    borderColor: "#e5e7eb",
                    borderWidth: 1,
                    anchorSize: new maps.Size(14, 10),
                    anchorSkew: true,
                    anchorColor: "white",
                    pixelOffset: new maps.Point(0, -10),
                });

                infoWindowsRef.current.push(infoWindow);

                // 마커 클릭 이벤트
                maps.Event.addListener(marker, "click", () => {
                    // 모든 인포윈도우 닫기
                    infoWindowsRef.current.forEach((iw) => {
                        try {
                            iw.close();
                        } catch (e) {
                            console.warn("InfoWindow close error:", e);
                        }
                    });

                    // 클릭한 마커의 인포윈도우 열기
                    infoWindow.open(map, marker);
                });
            });

            // 여러 위치가 있을 때 bounds 조정
            if (locations.length > 1) {
                const bounds = new maps.LatLngBounds();
                locations.forEach((loc) => {
                    bounds.extend(new maps.LatLng(loc.lat, loc.lng));
                });

                // 모든 마커가 보이도록 지도 영역 조정
                map.fitBounds(bounds, {
                    top: 50,
                    right: 50,
                    bottom: 50,
                    left: 50,
                });
            }

            // 첫 번째 마커의 인포윈도우 자동으로 열기
            if (
                locations.length === 1 &&
                infoWindowsRef.current[0] &&
                markersRef.current[0]
            ) {
                setTimeout(() => {
                    try {
                        infoWindowsRef.current[0].open(
                            map,
                            markersRef.current[0]
                        );
                    } catch (e) {
                        console.warn("InfoWindow open error:", e);
                    }
                }, 500);
            }

            // 윈도우 리사이즈 이벤트 처리
            const handleResize = () => {
                if (mapInstanceRef.current && maps.Event) {
                    maps.Event.trigger(mapInstanceRef.current, "resize");
                }
            };

            window.addEventListener("resize", handleResize);

            // Cleanup
            return () => {
                window.removeEventListener("resize", handleResize);

                // 인포윈도우 정리
                infoWindowsRef.current.forEach((iw) => {
                    try {
                        iw.setMap(null);
                    } catch (e) {
                        // 에러 무시
                    }
                });
                infoWindowsRef.current = [];

                // 마커 정리
                markersRef.current.forEach((marker) => {
                    try {
                        marker.setMap(null);
                    } catch (e) {
                        // 에러 무시
                    }
                });
                markersRef.current = [];

                // 지도 인스턴스 정리
                if (mapInstanceRef.current) {
                    try {
                        mapInstanceRef.current.destroy();
                    } catch (e) {
                        // 에러 무시
                    }
                    mapInstanceRef.current = null;
                }
            };
        } catch (error) {
            console.error("지도 생성 중 오류 발생:", error);
            setLoadError("지도를 표시하는 중 오류가 발생했습니다.");
        }
    }, [isMapReady, locations, showControls, height, loadError]);

    // 3) 위치 정보가 없을 때의 UI
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

    // 4) 에러 상태 표시
    if (loadError) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-600 mb-2">{loadError}</p>
                    <p className="text-xs text-red-500">
                        네이버 클라우드 플랫폼에서 도메인이 등록되어 있는지
                        확인해주세요.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // 5) 정상 렌더링
    return (
        <div className="space-y-3">
            {/* 지도 컨테이너 */}
            <div
                ref={mapRef}
                style={{ height: `${height}px`, width: "100%" }}
                className="rounded-lg border border-gray-200 overflow-hidden bg-gray-100"
            >
                {!isMapReady && !loadError && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-500">
                                지도를 불러오는 중...
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* 위치 목록 */}
            <div className="space-y-2">
                {locations.map((loc, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 border-blue-200 flex-shrink-0"
                        >
                            {idx + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {loc.storeName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {loc.roadAddress || loc.address}
                            </p>
                            {loc.phone && (
                                <p className="text-xs text-gray-500">
                                    📞 {loc.phone}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() =>
                                window.open(
                                    `https://map.naver.com/p/search/${encodeURIComponent(
                                        loc.storeName + " " + loc.roadAddress
                                    )}`,
                                    "_blank",
                                    "noopener,noreferrer"
                                )
                            }
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                            title="네이버 지도에서 보기"
                            aria-label={`${loc.storeName} 네이버 지도에서 보기`}
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LocationMap;
