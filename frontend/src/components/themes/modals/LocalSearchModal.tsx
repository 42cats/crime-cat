import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Place } from '@/lib/types';
import { naverMapService } from '@/api/external';

interface LocalSearchModalProps {
  onSelect: (place: Place) => void;
}

const LocalSearchModal: React.FC<LocalSearchModalProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
	setIsLoading(true);
	try {
	  const results = await naverMapService.searchLocal(query);
	  setResults(results || []);
	} catch (error) {
	  console.error('검색 실패:', error);
	} finally {
	  setIsLoading(false);
	}
  };

  const handleSelect = (place: Place & { mapx?: string; mapy?: string }) => {
	const plainTitle = place.title.replace(/<[^>]+>/g, '');
	const lat = place.mapy ? Number(place.mapy) : 0;
	const lng = place.mapx ? Number(place.mapx) : 0;
  
	const selectedPlace: Place = {
	  ...place,
	  title: plainTitle,
	  lat,
	  lng,
	};
  
	onSelect(selectedPlace);
	setIsOpen(false);
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>장소 검색</Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>장소 검색</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mt-2">
            <Input
              placeholder="검색어를 입력하세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>검색</Button>
          </div>

          <ScrollArea className="mt-4 h-64 space-y-3 pr-2">
            {results.length === 0 && (
              <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
            )}
            {results.map((place, idx) => (
              <div
                key={idx}
                className="p-3 border rounded-md hover:bg-muted transition cursor-pointer"
                onClick={() => handleSelect(place)}
              >
                <p className="font-semibold" dangerouslySetInnerHTML={{ __html: place.title }} />
                <p className="text-sm text-muted-foreground">도로명: {place.roadAddress}</p>
                <p className="text-sm text-muted-foreground">지번: {place.address}</p>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocalSearchModal;