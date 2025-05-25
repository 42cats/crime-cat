import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EscapeRoomLocation } from '@/lib/types';
import LocationSearchInput from './LocationSearchInput';
import LocationSearchResults from './LocationSearchResults';
import SelectedLocationsList from './SelectedLocationsList';

interface LocationSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedLocations: EscapeRoomLocation[];
    onLocationsChange: (locations: EscapeRoomLocation[]) => void;
    maxLocations?: number;
}

const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
    isOpen,
    onClose,
    selectedLocations,
    onLocationsChange,
    maxLocations = 10
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleLocationSelect = (location: any) => {
        // 네이버 API 응답을 EscapeRoomLocation 형태로 변환
        const newLocation: EscapeRoomLocation = {
            storeName: location.title.replace(/<[^>]+>/g, ''), // HTML 태그 제거
            address: location.address,
            roadAddress: location.roadAddress || location.address,
            lat: parseFloat(location.mapy) / 10000000, // 네이버 API 좌표 변환
            lng: parseFloat(location.mapx) / 10000000,
            link: location.link,
            phone: location.telephone || undefined,
            description: location.description || undefined
        };

        // 중복 체크 (매장명과 주소로)
        const isDuplicate = selectedLocations.some(
            loc => loc.storeName === newLocation.storeName && 
                   loc.address === newLocation.address
        );

        if (!isDuplicate && selectedLocations.length < maxLocations) {
            onLocationsChange([...selectedLocations, newLocation]);
        }
    };

    const handleLocationRemove = (index: number) => {
        const newLocations = selectedLocations.filter((_, i) => i !== index);
        onLocationsChange(newLocations);
    };

    const handleSave = () => {
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>매장 위치 검색 및 등록</DialogTitle>
                </DialogHeader>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                    {/* 검색 영역 */}
                    <div className="flex flex-col space-y-4">
                        <LocationSearchInput
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            onSearch={setSearchResults}
                            onSearchingChange={setIsSearching}
                        />

                        <LocationSearchResults
                            results={searchResults}
                            isSearching={isSearching}
                            onLocationSelect={handleLocationSelect}
                            selectedLocations={selectedLocations}
                        />
                    </div>

                    {/* 선택된 위치 목록 */}
                    <div className="flex flex-col space-y-4">
                        <SelectedLocationsList
                            locations={selectedLocations}
                            onLocationRemove={handleLocationRemove}
                            maxLocations={maxLocations}
                            onSave={handleSave}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LocationSearchModal;