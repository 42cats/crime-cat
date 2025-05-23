import React from 'react';
import { Globe, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UrlSettingsProps {
    homepageUrl: string;
    reservationUrl: string;
    onHomepageUrlChange: (url: string) => void;
    onReservationUrlChange: (url: string) => void;
    disabled?: boolean;
}

const UrlSettings: React.FC<UrlSettingsProps> = ({
    homepageUrl,
    reservationUrl,
    onHomepageUrlChange,
    onReservationUrlChange,
    disabled = false
}) => {
    const validateUrl = (url: string): boolean => {
        if (!url.trim()) return true; // 빈 값은 허용
        try {
            new URL(url);
            return url.startsWith('http://') || url.startsWith('https://');
        } catch {
            return false;
        }
    };

    const isHomepageValid = validateUrl(homepageUrl);
    const isReservationValid = validateUrl(reservationUrl);

    const testUrl = (url: string) => {
        if (url && validateUrl(url)) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-gray-600" />
                <Label className="text-sm font-medium">링크 정보</Label>
            </div>
            
            <p className="text-xs text-gray-500">
                방탈출 매장의 홈페이지나 예약 페이지 링크를 등록하세요 (선택사항)
            </p>

            {/* 홈페이지 URL */}
            <div className="space-y-2">
                <Label htmlFor="homepageUrl" className="text-sm font-medium">
                    홈페이지 URL
                </Label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            id="homepageUrl"
                            type="url"
                            value={homepageUrl}
                            onChange={(e) => onHomepageUrlChange(e.target.value)}
                            placeholder="https://example.com"
                            className={`pl-10 ${!isHomepageValid ? 'border-red-500' : ''}`}
                            disabled={disabled}
                        />
                    </div>
                    {homepageUrl && isHomepageValid && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => testUrl(homepageUrl)}
                            disabled={disabled}
                            className="px-3"
                        >
                            <ExternalLink className="w-3 h-3" />
                        </Button>
                    )}
                </div>
                {homepageUrl && !isHomepageValid && (
                    <p className="text-xs text-red-500">
                        올바른 URL 형식이 아닙니다. http:// 또는 https://로 시작해야 합니다.
                    </p>
                )}
                <p className="text-xs text-gray-500">
                    방탈출 매장의 공식 홈페이지 주소를 입력하세요
                </p>
            </div>

            {/* 예약 페이지 URL */}
            <div className="space-y-2">
                <Label htmlFor="reservationUrl" className="text-sm font-medium">
                    예약 페이지 URL
                </Label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            id="reservationUrl"
                            type="url"
                            value={reservationUrl}
                            onChange={(e) => onReservationUrlChange(e.target.value)}
                            placeholder="https://booking.example.com"
                            className={`pl-10 ${!isReservationValid ? 'border-red-500' : ''}`}
                            disabled={disabled}
                        />
                    </div>
                    {reservationUrl && isReservationValid && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => testUrl(reservationUrl)}
                            disabled={disabled}
                            className="px-3"
                        >
                            <ExternalLink className="w-3 h-3" />
                        </Button>
                    )}
                </div>
                {reservationUrl && !isReservationValid && (
                    <p className="text-xs text-red-500">
                        올바른 URL 형식이 아닙니다. http:// 또는 https://로 시작해야 합니다.
                    </p>
                )}
                <p className="text-xs text-gray-500">
                    예약을 할 수 있는 페이지 주소를 입력하세요 (예: 네이버 예약, 자체 예약 시스템 등)
                </p>
            </div>

            {/* 안내 메시지 */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                    <strong>참고:</strong> 링크 정보는 선택사항입니다. 사용자들이 매장 정보를 더 쉽게 찾을 수 있도록 도움을 줍니다.
                    잘못된 링크나 악성 사이트는 신고될 수 있습니다.
                </AlertDescription>
            </Alert>

            {/* URL 입력 요약 */}
            {(homepageUrl || reservationUrl) && (
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-gray-700">등록된 링크:</p>
                    {homepageUrl && isHomepageValid && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Globe className="w-3 h-3" />
                            <span>홈페이지: {homepageUrl.length > 50 ? homepageUrl.substring(0, 50) + '...' : homepageUrl}</span>
                        </div>
                    )}
                    {reservationUrl && isReservationValid && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>예약 페이지: {reservationUrl.length > 50 ? reservationUrl.substring(0, 50) + '...' : reservationUrl}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UrlSettings;