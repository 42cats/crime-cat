import React from 'react';
import { cn } from '@/lib/utils';

interface ImageSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'card' | 'avatar' | 'banner';
}

export const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  width,
  height,
  className,
  variant = 'card'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'avatar':
        return 'rounded-full w-10 h-10';
      case 'banner':
        return 'rounded-lg w-full h-48';
      case 'card':
      default:
        return 'rounded-lg w-full h-48';
    }
  };

  const styles = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200',
        'dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
        getVariantClasses(),
        className
      )}
      style={styles}
    >
      <div 
        className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{
          animation: 'shimmer 2s infinite',
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          backgroundSize: '200% 100%',
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

// 테마 카드용 스켈레톤
export const ThemeCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border p-4 space-y-4">
      <ImageSkeleton variant="banner" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="flex space-x-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// 프로필 카드용 스켈레톤
export const ProfileCardSkeleton: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 p-4">
      <ImageSkeleton variant="avatar" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
      </div>
    </div>
  );
};

// 게임 기록용 스켈레톤
export const GameHistoryCardSkeleton: React.FC = () => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse" />
      </div>
      <div className="flex space-x-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
      </div>
    </div>
  );
};