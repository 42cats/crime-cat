import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CrimesceneThemeSummeryDto } from '@/api/profile/themes';
import { getProfileDetail, ProfileDetailDto } from '@/api/profile/detail';
import { useEffect, useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ThemeDetailModalProps {
  theme: CrimesceneThemeSummeryDto;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const ThemeDetailModal: React.FC<ThemeDetailModalProps> = ({
  theme,
  isOpen,
  onClose,
  userId
}) => {
  const [profile, setProfile] = useState<ProfileDetailDto | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      getProfileDetail(userId)
        .then(data => setProfile(data))
        .catch(err => console.error("프로필 상세 정보 로드 실패:", err));
    }
  }, [isOpen, userId]);

  const handleShare = async () => {
    try {
      const themeUrl = `${window.location.origin}/themes/detail/${theme.themeId}`;
      await navigator.clipboard.writeText(themeUrl);
      toast.success("테마 링크가 복사되었습니다");
    } catch (error) {
      toast.error("링크 복사에 실패했습니다");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-5xl w-full bg-white rounded-lg overflow-hidden p-0">
        <DialogTitle className="sr-only">테마 상세 정보</DialogTitle>
        
        <div className="relative flex flex-col md:flex-row max-h-[90vh]">
          {/* 이미지 */}
          <div className="md:w-2/3 bg-black flex items-center justify-center">
            <img
              src={theme.thumbNail || "/content/image/default_image2.png"}
              alt={theme.themeTitle}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          </div>

          {/* 테마 정보 섹션 */}
          <div className="md:w-1/3 flex flex-col max-h-[90vh] bg-white">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="공유하기"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="닫기"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* 프로필 정보 */}
            <div className="flex items-center p-4 border-b">
              <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                <img
                  src={
                    profile?.avatarImage ||
                    "https://cdn.discordapp.com/embed/avatars/1.png"
                  }
                  alt={
                    profile?.userNickname ||
                    "프로필"
                  }
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold text-sm">
                {profile?.userNickname || "사용자"}
              </span>
            </div>

            {/* 테마 정보 */}
            <div className="flex-grow overflow-y-auto p-4">
              <h3 className="text-xl font-bold mb-4">
                {theme.themeTitle}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">가격</h4>
                  <p>{theme.themePrice?.toLocaleString()}원</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">인원</h4>
                  <p>
                    {theme.themeMinPlayer === theme.themeMaxPlayer 
                      ? `${theme.themeMinPlayer}인` 
                      : `${theme.themeMinPlayer}~${theme.themeMaxPlayer}인`}
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => window.open(`/themes/detail/${theme.themeId}`, '_blank')}
                  >
                    테마 상세 페이지로 이동
                  </Button>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="border-t p-4">
              <div className="flex justify-between mb-2">
                <div className="flex space-x-4">
                  <button className="text-gray-800 hover:text-red-500 transition-colors">
                    <Heart size={24} />
                  </button>
                  <button className="text-gray-800 hover:text-blue-500 transition-colors">
                    <MessageSquare size={24} />
                  </button>
                  <button 
                    className="text-gray-800 hover:text-green-500 transition-colors"
                    onClick={handleShare}
                  >
                    <Share2 size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeDetailModal;
