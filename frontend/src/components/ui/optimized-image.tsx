import React, { useState, useEffect } from 'react';
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
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

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

  // 이미지 소스 최적화
  const getOptimizedSrc = (originalSrc: string) => {
    // 이미 최적화된 URL이거나 외부 URL인 경우 그대로 반환
    if (originalSrc.includes('webp') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // WebP 지원 시 확장자 변경 시도
    if (supportsWebP && originalSrc.includes('/content/image/')) {
      const webpSrc = originalSrc.replace(/\.(png|jpg|jpeg)$/, '.webp');
      return webpSrc;
    }

    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallback);
    }
  };

  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder */}
      {!isLoaded && placeholder === 'blur' && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"
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
        fetchPriority={fetchPriority as any}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          ...props.style,
          objectFit: props.style?.objectFit || 'cover',
        }}
      />

      <style jsx>{`
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
      className={cn(sizes[size], 'rounded-full', className)}
    />
  );
};