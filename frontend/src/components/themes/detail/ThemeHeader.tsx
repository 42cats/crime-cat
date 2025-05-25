import React, { useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UTCToKST } from "@/lib/dateFormat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeDetailType } from "@/lib/types";
import ImageViewerModal from "@/components/sns/image/ImageViewerModal";

interface ThemeHeaderProps {
  theme: ThemeDetailType;
  navigate: NavigateFunction;
  onProfileClick: (userId: string) => void;
}

const ThemeHeader: React.FC<ThemeHeaderProps> = ({ 
  theme, 
  navigate, 
  onProfileClick 
}) => {
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  
  return (
    <>
      {/* 상단 내비게이션 */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/themes/${theme.type.toLowerCase()}`)}
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> 테마 목록으로 돌아가기
        </button>
      </div>

      {/* 헤더 섹션: 이미지 */}
      <div className="mb-8">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6">
          <img
            src={`${theme?.thumbnail || "/content/image/default_image2.png"}`}
            alt={theme.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setIsImageViewerOpen(true)}
          />
          
          {/* 이미지 뷰어 모달 */}
          <ImageViewerModal
            isOpen={isImageViewerOpen}
            onClose={() => setIsImageViewerOpen(false)}
            images={[theme?.thumbnail || "/content/image/default_image2.png"]}
            initialIndex={0}
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-start items-center mb-2">
            <Badge variant="secondary">{theme.type}</Badge>
          </div>

          {/* 제목 */}
          <h1 className="text-4xl font-bold text-center break-words mb-3">{theme.title}</h1>

          {/* 작성자 + 시간 (제목 아래, 우측 정렬) */}
          <div className="flex justify-end text-muted-foreground text-sm">
            <div className="flex flex-col items-end">
              <button
                className="hover:text-primary transition-colors font-medium flex items-center gap-2 justify-end mb-1"
                onClick={() => onProfileClick(theme.author.id)}
              >
                {theme.author.avatarUrl ? (
                  <Avatar className="h-5 w-5 border border-border">
                    <AvatarImage
                      src={theme.author.avatarUrl}
                      alt={theme.author.nickname}
                    />
                    <AvatarFallback className="bg-muted text-xs text-primary font-bold">
                      {theme.author.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-5 w-5 border border-border">
                    <AvatarFallback className="bg-muted text-xs text-primary font-bold">
                      {theme.author.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {theme.author.nickname}
              </button>
              <span><UTCToKST date={theme.createdAt} /></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThemeHeader;