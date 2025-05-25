import React, { useState, useEffect } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { locationService, Location } from '@/api/sns/locationService';

interface LocationPickerProps {
  value: Location | null;
  onChange: (location: Location | null) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCurrentLocationLoading, setIsCurrentLocationLoading] = useState(false);
  
  // 위치 검색
  useEffect(() => {
    if (searchTerm.length < 2) {
      setLocations([]);
      setShowDropdown(false);
      return;
    }
    
    const searchLocations = async () => {
      setIsLoading(true);
      try {
        const foundLocations = await locationService.searchLocations(searchTerm);
        setLocations(foundLocations);
        setShowDropdown(foundLocations.length > 0);
      } catch (error) {
        console.error('위치 검색 실패:', error);
        setLocations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      searchLocations();
    }, 500); // 입력 후 500ms 후에 검색 실행 (디바운싱)
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // 현재 위치 가져오기
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      return;
    }
    
    setIsCurrentLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // 실제 구현에서는 백엔드 API를 통해 좌표를 주소로 변환
        // 여기서는 임시 데이터 사용
        const mockLocation: Location = {
          id: 'current-location',
          name: '현재 위치',
          latitude,
          longitude
        };
        
        setSearchTerm(mockLocation.name);
        onChange(mockLocation);
        setIsCurrentLocationLoading(false);
      },
      (error) => {
        console.error('현재 위치 가져오기 오류:', error);
        alert('현재 위치를 가져올 수 없습니다.');
        setIsCurrentLocationLoading(false);
      }
    );
  };
  
  // 위치 선택
  const handleSelectLocation = (location: Location) => {
    setSearchTerm(location.name);
    onChange(location);
    setShowDropdown(false);
  };
  
  // 위치 제거
  const handleRemoveLocation = () => {
    setSearchTerm('');
    onChange(null);
  };
  
  return (
    <div className="w-full">
      <div className="relative">
        <div className="flex items-center">
          <div className="relative flex-grow">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
            </div>
            
            <Input
              type="text"
              className="pl-10 pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="위치 검색..."
              onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
            />
            
            {searchTerm && (
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={handleRemoveLocation}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-2 whitespace-nowrap"
            onClick={handleGetCurrentLocation}
            disabled={isCurrentLocationLoading}
          >
            {isCurrentLocationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <MapPin className="h-4 w-4 mr-1" />
            )}
            현재 위치
          </Button>
        </div>
        
        {showDropdown && (
          <div className="absolute z-10 mt-1 max-h-48 overflow-y-auto w-full bg-card rounded-md border border-border shadow-md">
            {isLoading ? (
              <div className="p-4 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : locations.length > 0 ? (
              locations.map((location) => (
                <div
                  key={location.id}
                  className="p-2 cursor-pointer hover:bg-muted flex items-center"
                  onClick={() => handleSelectLocation(location)}
                >
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{location.name}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        )}
      </div>
      
      {value && (
        <div className="mt-2 text-sm flex items-center text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{value.name}</span>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
