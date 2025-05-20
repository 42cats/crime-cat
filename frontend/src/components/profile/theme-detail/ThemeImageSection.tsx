import React from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ThemeImageSectionProps {
  thumbNail: string | null;
  title: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDesktop: boolean;
}

const ThemeImageSection: React.FC<ThemeImageSectionProps> = ({
  thumbNail,
  title,
  isCollapsed,
  onToggleCollapse,
  isDesktop
}) => {
  // 모바일에서는 간단한 이미지만 표시
  if (!isDesktop) {
    return (
      <div className="bg-black flex items-center justify-center" style={{ height: '250px' }}>
        <img
          src={thumbNail || "/content/image/default_image2.png"}
          alt={title}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // 데스크탑에서는 접기/펼치기 가능한 이미지 섹션
  return (
    <div 
      className={`bg-black flex items-center justify-center transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-3/5'}`}
      style={{ height: '100%' }}
    >
      <img
        src={thumbNail || "/content/image/default_image2.png"}
        alt={title}
        className="w-full h-auto object-contain"
        style={{ maxHeight: '100%' }}
      />
      
      {/* 토글 버튼 */}
      {!isCollapsed ? (
        <button
          onClick={onToggleCollapse}
          className="absolute top-1/2 right-4 p-2 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 text-gray-800 transition-colors z-10"
          title="이미지 접기"
        >
          <ChevronsLeft size={18} />
        </button>
      ) : null}
    </div>
  );
};

export default ThemeImageSection;