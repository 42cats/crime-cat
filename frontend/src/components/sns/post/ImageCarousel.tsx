import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LazyImage from '../common/LazyImage';

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 이미지가 없거나 1장일 경우 컨트롤 불필요
  if (!images || images.length === 0) {
    return null;
  }
  
  if (images.length === 1) {
    return <LazyImage src={images[0]} alt="게시물 이미지" aspectRatio="4/5" />;
  }
  
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div className="relative aspect-[4/5]">
      {/* 이미지 */}
      <div className="w-full h-full overflow-hidden">
        <div 
          className="w-full h-full flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div 
              key={index} 
              className="w-full h-full flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <LazyImage 
                src={image} 
                alt={`게시물 이미지 ${index + 1}`} 
                className="w-full h-full" 
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* 좌우 컨트롤 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/40 text-white rounded-full h-8 w-8"
        onClick={handlePrevious}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/40 text-white rounded-full h-8 w-8"
        onClick={handleNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      
      {/* 하단 진행 표시 점 */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              index === currentIndex ? 'bg-primary w-4' : 'bg-white/70'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
