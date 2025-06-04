import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  priority?: boolean;
  quality?: 'low' | 'medium' | 'high';
  placeholder?: 'blur' | 'empty';
  className?: string;
  onLoadComplete?: () => void;
  aspectRatio?: 'square' | '4/5' | '16/9' | 'auto';
  useIntersectionObserver?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallback = '/content/image/default_image.png',
  priority = false,
  quality = 'medium',
  placeholder = 'empty',
  className,
  onLoadComplete,
  aspectRatio = 'auto',
  useIntersectionObserver = false,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [isInView, setIsInView] = useState(!useIntersectionObserver);
  
  // src가 변경되면 상태 리셋
  useEffect(() => {
    setImageSrc(src);
    setIsLoaded(false);
    setHasError(false);
  }, [src]);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // WebP 지원 확인
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dataURL = canvas.toDataURL('image/webp');
      setSupportsWebP(dataURL.indexOf('image/webp') === 5);
    };

    checkWebPSupport();
  }, []);

  // Intersection Observer 로직
  useEffect(() => {
    if (!useIntersectionObserver || !wrapperRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.01,
        rootMargin: '100px',
      }
    );

    observer.observe(wrapperRef.current);

    return () => observer.disconnect();
  }, [useIntersectionObserver]);

  // 이미지 소스 최적화
  const getOptimizedSrc = (originalSrc: string) => {
    // 이미 최적화된 URL이거나 외부 URL인 경우 그대로 반환
    if (originalSrc.includes('webp') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // WebP 지원 시 확장자 변경 시도
    if (supportsWebP && originalSrc.includes('/content/image/')) {
      // JPG 확장자도 처리 (대소문자 구분 없이)
      const webpSrc = originalSrc.replace(/\.(png|jpg|jpeg|JPG|PNG|JPEG)$/i, '.webp');
      return webpSrc;
    }

    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  const handleError = () => {
    if (!hasError && imageSrc !== fallback) {
      setHasError(true);
      setImageSrc(fallback);
      setIsLoaded(false); // Reset loaded state for fallback image
    }
  };

  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';

  // Aspect ratio 클래스
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case '4/5': return 'aspect-[4/5]';
      case '16/9': return 'aspect-video';
      default: return '';
    }
  };

  const wrapperClasses = cn(
    'relative overflow-hidden',
    aspectRatio !== 'auto' && getAspectRatioClass(),
    useIntersectionObserver && 'min-h-[100px] w-full',
    className
  );

  return (
    <div ref={wrapperRef} className={wrapperClasses}>
      {isInView ? (
        <>
          {/* Placeholder */}
          {!isLoaded && placeholder === 'blur' && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"
              style={{
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          )}

          <img
            {...props}
            src={getOptimizedSrc(imageSrc)}
            alt={alt}
            loading={loading}
            fetchpriority={fetchPriority as any}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              aspectRatio !== 'auto' ? 'w-full h-full object-cover' : '',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              ...props.style,
              objectFit: props.style?.objectFit || 'cover',
            }}
          />

          {/* Loading spinner */}
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 bg-muted/20 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}

          {/* Error state */}
          {hasError && (
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
      ) : (
        /* Intersection observer placeholder */
        <div className="absolute inset-0 bg-muted/20 animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-muted/10 to-transparent animate-shimmer"></div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

// 로고 전용 컴포넌트
interface LogoProps {
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  theme = 'light', 
  size = 'md',
  className 
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <OptimizedImage
      src={theme === 'dark' ? '/content/image/logo_dark.png' : '/content/image/logo_light.png'}
      alt="미스터리 플레이스 로고"
      priority={true}
      className={cn(sizes[size], className)}
    />
  );
};

// 텍스트 로고 컴포넌트
export const TextLogo: React.FC<LogoProps> = ({ 
  theme = 'light', 
  className 
}) => {
  return (
    <OptimizedImage
      src={theme === 'dark' ? '/content/image/mystery_place_dark.png' : '/content/image/mystery_place_light.png'}
      alt="미스터리 플레이스"
      priority={true}
      className={cn('w-20 h-15', className)}
    />
  );
};

// 아바타 이미지 컴포넌트
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  size = 'md',
  className
}) => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <OptimizedImage
      src={src || '/content/image/default_profile_image.png'}
      alt={alt}
      fallback="/content/image/default_profile_image.png"
      placeholder="blur"
      aspectRatio="square"
      className={cn(sizes[size], 'rounded-full object-cover flex-shrink-0', className)}
    />
  );
};

// LazyImage 대체 컴포넌트 (SNS용)
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | '4/5' | '16/9';
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  aspectRatio = 'square'
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio={aspectRatio}
      useIntersectionObserver={true}
      placeholder="blur"
      className={className}
    />
  );
};