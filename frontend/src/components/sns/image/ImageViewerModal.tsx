import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  // 모달이 열릴 때마다 초기 상태로 리셋
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetImageView();
    }
  }, [isOpen, initialIndex]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowLeft":
          handlePrevImage();
          break;
        case "ArrowRight":
          handleNextImage();
          break;
        case "Escape":
          onClose();
          break;
        case "+":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "0":
          resetImageView();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  // 이미지 리셋
  const resetImageView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 이미지 이동 함수
  const handlePrevImage = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    resetImageView();
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    resetImageView();
  };

  // 확대/축소 함수
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  // 마우스/터치 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale <= 1) return;
    
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    
    setIsDragging(true);
    setStartPos({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const newX = e.touches[0].clientX - startPos.x;
    const newY = e.touches[0].clientY - startPos.y;
    
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 더블 클릭 시 확대/축소 토글
  const handleDoubleClick = () => {
    if (scale > 1) {
      resetImageView();
    } else {
      setScale(2);
    }
  };

  // 핀치 줌 처리를 위한 상태
  const initialPinchDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);

  // 핀치 줌 이벤트 핸들러
  const handleTouchStartPinch = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 두 손가락 사이의 거리 계산
      const dist = getDistanceBetweenTouches(e);
      initialPinchDistance.current = dist;
      initialScale.current = scale;
    }
  };

  const handleTouchMovePinch = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance.current !== null) {
      const currentDistance = getDistanceBetweenTouches(e);
      const scaleFactor = currentDistance / initialPinchDistance.current;
      
      // 새 스케일 계산 (최소 0.5, 최대 5)
      const newScale = Math.max(0.5, Math.min(5, initialScale.current * scaleFactor));
      setScale(newScale);
    }
  };

  // 두 터치 포인트 사이의 거리 계산
  const getDistanceBetweenTouches = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 휠 이벤트 핸들러
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // 휠을 위로 올리면 확대, 아래로 내리면 축소
    const delta = e.deltaY * -0.01;
    const newScale = Math.max(0.5, Math.min(5, scale + delta));
    setScale(newScale);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 bg-transparent border-0 shadow-none"
        closeButton={false}
      >
        <div className="relative w-full h-full bg-black/90 flex items-center justify-center overflow-hidden">
          {/* 닫기 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 text-white bg-black/30 hover:bg-black/50"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
          
          {/* 확대/축소 버튼 */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white bg-black/30 hover:bg-black/50"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white bg-black/30 hover:bg-black/50"
              onClick={resetImageView}
            >
              <span className="text-xs font-bold">{Math.round(scale * 100)}%</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white bg-black/30 hover:bg-black/50"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
          </div>
          
          {/* 이미지 뷰어 */}
          <div 
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              handleTouchStartPinch(e);
              handleTouchStart(e);
            }}
            onTouchMove={(e) => {
              handleTouchMovePinch(e);
              handleTouchMove(e);
            }}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <img
              ref={imageRef}
              src={images[currentIndex]}
              alt={`이미지 ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-none select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
              onDoubleClick={handleDoubleClick}
              draggable={false}
            />
          </div>
          
          {/* 이전/다음 이미지 버튼 (2개 이상일 때만 표시) */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full h-10 w-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full h-10 w-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              
              {/* 이미지 인디케이터 */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white bg-black/30 px-2 py-1 rounded-md text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewerModal;
