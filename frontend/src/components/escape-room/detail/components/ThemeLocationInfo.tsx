import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { EscapeRoomThemeDetailType } from '@/lib/types';
import LocationMap from '../LocationMap';

interface ThemeLocationInfoProps {
    theme: EscapeRoomThemeDetailType;
}

const ThemeLocationInfo: React.FC<ThemeLocationInfoProps> = ({ theme }) => {
    if (!theme.locations || theme.locations.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    매장 위치 ({theme.locations.length}개 지점)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {theme.locations.map((location, index) => (
                        <div
                            key={index}
                            className="p-4 border rounded-lg space-y-2 hover:shadow-md transition-shadow"
                        >
                            <div className="font-medium text-sm">
                                {location.storeName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {location.roadAddress}
                            </div>
                            {location.phone && (
                                <div className="text-xs text-muted-foreground">
                                    📞 {location.phone}
                                </div>
                            )}
                            {location.description && (
                                <div className="text-xs text-muted-foreground mt-2">
                                    {location.description}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 지도 컴포넌트 */}
                <LocationMap locations={theme.locations} />
            </CardContent>
        </Card>
    );
};

export default ThemeLocationInfo;
