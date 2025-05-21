import React, { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | '4/5' | '16/9';
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  aspectRatio = 'square' 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  
  // 이미지 ID 생성 (src를 기반으로 한 고유 ID)
  const id = `lazy-img-${src.split('/').pop()}`;
  
  useEffect(() => {
    // IntersectionObserver로 뷰포트에 들어왔는지 감지
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    const imgElement = document.getElementById(id);
    if (imgElement) {
      observer.observe(imgElement);
    }
    
    return () => observer.disconnect();
  }, [id, src]);
  
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  const handleError = () => {
    setError(true);
  };
  
  // 종횡비 클래스 결정
  const aspectRatioClass = 
    aspectRatio === 'square' ? 'aspect-square' :
    aspectRatio === '4/5' ? 'aspect-[4/5]' :
    aspectRatio === '16/9' ? 'aspect-video' : 'aspect-square';
  
  return (
    <div 
      id={id}
      className={`relative overflow-hidden ${aspectRatioClass} ${className}`}
    >
      {isInView && (
        <>
          {/* 실제 이미지 (로드 완료 시 표시) */}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleLoad}
            onError={handleError}
          />
          
          {/* 로딩 중 표시 */}
          {!isLoaded && !error && (
            <div className="absolute inset-0 bg-muted/20 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* 에러 표시 */}
          {error && (
            <div className="absolute inset-0 bg-muted/10 flex flex-col items-center justify-center text-muted-foreground">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-10 w-10 mb-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
              <span className="text-sm">이미지를 불러올 수 없습니다</span>
            </div>
          )}
        </>
      )}
      
      {/* 뷰포트에 들어오기 전 플레이스홀더 */}
      {!isInView && (
        <div className="absolute inset-0 bg-muted/20 animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-muted/10 to-transparent animate-shimmer"></div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
