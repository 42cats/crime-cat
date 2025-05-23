import React, { useState } from 'react';
import { MapPin, Plus, Edit, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { EscapeRoomLocation } from '@/lib/types';
import LocationSearchModal from './LocationSearchModal';
import LocationCard from './LocationCard';

interface LocationSelectorProps {
    locations: EscapeRoomLocation[];
    onLocationsChange: (locations: EscapeRoomLocation[]) => void;
    label?: string;
    required?: boolean;
    maxLocations?: number;
    className?: string;
    description?: string;
    disabled?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
    locations,
    onLocationsChange,
    label = "매장 위치",
    required = false,
    maxLocations = 10,
    className,
    description,
    disabled = false
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleLocationRemove = (index: number) => {
        const newLocations = locations.filter((_, i) => i !== index);
        onLocationsChange(newLocations);
    };

    const openModal = () => {
        if (!disabled) {
            setIsModalOpen(true);
        }
    };

    return (
        <div className={className}>
            {/* 라벨 */}
            {label && (
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                    <span className="text-gray-500 ml-1">
                        ({locations.length}/{maxLocations})
                    </span>
                </Label>
            )}

            {/* 설명 */}
            {description && (
                <p className="text-xs text-gray-500 mb-3">{description}</p>
            )}

            {/* 선택된 매장 목록 */}
            {locations.length > 0 && (
                <div className="space-y-2 mb-4">
                    {locations.map((location, index) => (
                        <LocationCard
                            key={index}
                            location={location}
                            onRemove={() => handleLocationRemove(index)}
                            disabled={disabled}
                        />
                    ))}
                </div>
            )}

            {/* 매장 추가/수정 버튼 */}
            <Card 
                className={`border-dashed border-2 transition-colors ${
                    disabled 
                        ? 'border-gray-200 bg-gray-50' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                }`}
                onClick={openModal}
            >
                <CardContent className="p-6">
                    <div className="text-center space-y-2">
                        {locations.length === 0 ? (
                            <>
                                <div className="flex justify-center">
                                    <div className={`rounded-full p-3 ${
                                        disabled ? 'bg-gray-200' : 'bg-blue-100'
                                    }`}>
                                        <MapPin className={`w-6 h-6 ${
                                            disabled ? 'text-gray-400' : 'text-blue-600'
                                        }`} />
                                    </div>
                                </div>
                                <h3 className={`text-sm font-medium ${
                                    disabled ? 'text-gray-400' : 'text-gray-700'
                                }`}>
                                    매장 위치 등록
                                </h3>
                                <p className={`text-xs ${
                                    disabled ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    클릭하여 방탈출 매장 위치를 검색하고 등록하세요
                                </p>
                                {required && locations.length === 0 && (
                                    <p className="text-xs text-red-500">
                                        최소 1개 이상의 매장이 필요합니다
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex justify-center items-center gap-2">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Map className="w-3 h-3" />
                                        {locations.length}개 매장 등록됨
                                    </Badge>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={disabled}
                                    className="mt-2"
                                >
                                    <Edit className="w-3 h-3 mr-1" />
                                    매장 수정
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 빠른 추가 버튼 (매장이 이미 있고 최대 개수에 도달하지 않은 경우) */}
            {locations.length > 0 && locations.length < maxLocations && !disabled && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={openModal}
                    className="w-full mt-2"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    매장 추가
                </Button>
            )}

            {/* 검색 모달 */}
            <LocationSearchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedLocations={locations}
                onLocationsChange={onLocationsChange}
                maxLocations={maxLocations}
            />
        </div>
    );
};

export default LocationSelector;