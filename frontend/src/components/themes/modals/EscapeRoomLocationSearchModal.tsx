import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Place } from '@/lib/types';
import { naverMapService } from '@/api/external';
import { Search, MapPin, Phone, ExternalLink } from 'lucide-react';

interface EscapeRoomLocationSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (location: {
    storeName: string;
    address: string;
    roadAddress: string;
    lat: number;
    lng: number;
    link: string;
    phone?: string;
    description?: string;
  }) => void;
}

const EscapeRoomLocationSearchModal: React.FC<EscapeRoomLocationSearchModalProps> = ({
  open,
  onOpenChange,
  onSelect
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      // 방탈출 관련 키워드를 포함한 검색
      const searchQuery = `${query} 방탈출`;
      const searchResults = await naverMapService.searchLocal(searchQuery);
      setResults(searchResults || []);
    } catch (error) {
      console.error('검색 실패:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (place: Place & { mapx?: string; mapy?: string }) => {
    // HTML 태그 제거
    const plainTitle = place.title.replace(/<[^>]+>/g, '');
    const lat = place.mapy ? Number(place.mapy) / 10000000 : 0; // 네이버 API는 좌표에 10^7을 곱해서 전달
    const lng = place.mapx ? Number(place.mapx) / 10000000 : 0;

    const selectedLocation = {
      storeName: plainTitle,
      address: place.address || '',
      roadAddress: place.roadAddress || '',
      lat,
      lng,
      link: place.link || '',
      phone: '', // 검색 결과에는 전화번호가 없으므로 빈 값
      description: '',
    };

    onSelect(selectedLocation);
    onOpenChange(false);
    setQuery('');
    setResults([]);
  };

  const isEscapeRoomRelated = (title: string, address: string) => {
    const escapeRoomKeywords = ['방탈출', '이스케이프', 'escape', '룸', 'room', '미스터리', '어드벤처'];
    const text = (title + ' ' + address).toLowerCase();
    return escapeRoomKeywords.some(keyword => text.includes(keyword.toLowerCase()));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            방탈출 매장 검색
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 검색 입력 */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                className="pl-10"
                placeholder="매장명이나 지역을 입력하세요 (예: 홍대 방탈출, 강남 이스케이프룸)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
              {isLoading ? '검색중...' : '검색'}
            </Button>
          </div>

          {/* 검색 팁 */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 검색 팁:</p>
            <ul className="space-y-1 text-xs">
              <li>• 매장명 + 지역: "홍대 방탈출", "강남 이스케이프룸"</li>
              <li>• 구체적인 매장명: "넥스트에디션", "키이스케이프"</li>
              <li>• 지역명만: "홍대", "강남", "건대" (방탈출 키워드가 자동 추가됩니다)</li>
            </ul>
          </div>

          {/* 검색 결과 */}
          <ScrollArea className="h-96">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">검색 중...</p>
                </div>
              </div>
            )}

            {!isLoading && results.length === 0 && query && (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  다른 키워드로 다시 검색해보세요.
                </p>
              </div>
            )}

            {!isLoading && results.length === 0 && !query && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  방탈출 매장을 검색해보세요.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {results.map((place, idx) => {
                const plainTitle = place.title.replace(/<[^>]+>/g, '');
                const isRecommended = isEscapeRoomRelated(plainTitle, place.address);
                
                return (
                  <div
                    key={idx}
                    className={`p-4 border rounded-lg hover:bg-muted/50 transition cursor-pointer relative ${
                      isRecommended ? 'border-primary/30 bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelect(place)}
                  >
                    {isRecommended && (
                      <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                        추천
                      </Badge>
                    )}
                    
                    <div className="pr-16">
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm leading-tight">
                            {plainTitle}
                          </h4>
                        </div>
                      </div>
                      
                      {place.roadAddress && (
                        <p className="text-sm text-muted-foreground mb-1">
                          📍 도로명: {place.roadAddress}
                        </p>
                      )}
                      
                      {place.address && (
                        <p className="text-sm text-muted-foreground mb-2">
                          📮 지번: {place.address}
                        </p>
                      )}
                      
                      {place.link && (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <ExternalLink className="w-3 h-3" />
                          네이버 지도에서 보기
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EscapeRoomLocationSearchModal;