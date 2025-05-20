import React, { useState, useEffect } from 'react';
import { getUserThemes, CrimesceneThemeSummeryDto } from '@/api/profile/themes';
import { Badge } from '@/components/ui/badge';
import { PackageIcon, Heart, MessageSquare, Share2 } from 'lucide-react';
import ThemeDetailModal from './ThemeDetailModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

interface ProfileThemeGridProps {
  userId: string;
}

const ProfileThemeGrid: React.FC<ProfileThemeGridProps> = ({ userId }) => {
  const [themes, setThemes] = useState<CrimesceneThemeSummeryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<CrimesceneThemeSummeryDto | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  // 테마 추천(좋아요) 상태 저장
  const [likedThemes, setLikedThemes] = useState<Record<string, boolean>>({});

  // 어떤 탭이 열릴지 추적 (info 또는 comments)
  const [modalTab, setModalTab] = useState<string>('info');

  useEffect(() => {
    setLoading(true);
    getUserThemes(userId)
      .then((data) => {
        console.log("테마 데이터:", data);
        setThemes(data.themeList || []);
        
        // 각 테마에 대한 좋아요 상태 초기화
        const likeStates: Record<string, boolean> = {};
        (data.themeList || []).forEach(theme => {
          likeStates[theme.themeId] = false;
        });
        setLikedThemes(likeStates);
      })
      .catch((err) => {
        console.error("테마 목록 로드 실패:", err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-[150px] md:min-h-[200px]">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  if (!themes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-md min-h-[150px] md:min-h-[200px]">
        <PackageIcon size={40} className="mb-3" />
        <p className="text-sm">제작한 테마가 없습니다.</p>
      </div>
    );
  }

  const handleOpenThemeModal = (theme: CrimesceneThemeSummeryDto, tab: string = 'info') => {
    setSelectedTheme(theme);
    setModalTab(tab);
  };

  const handleShare = async (themeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    
    try {
      // 정확한 경로로 수정 - 기본값 CRIMESCENE 카테고리 사용
      const url = `${window.location.origin}/themes/crimescene/${themeId}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: '링크 복사 완료',
        description: '테마 링크가 복사되었습니다.',
      });
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '브라우저 설정을 확인해주세요.',
        variant: 'destructive',
      });
    }
  };

  const handleThemeClick = (themeId: string) => {
    // 정확한 경로로 수정 - 기본값 CRIMESCENE 카테고리 사용
    navigate(`/themes/crimescene/${themeId}`);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 min-h-[150px] md:min-h-[200px]">
        {themes.map((theme) => (
          <div
            key={theme.themeId}
            className="relative bg-gray-100 overflow-hidden group cursor-pointer rounded-md shadow-sm hover:shadow-md transition-shadow flex flex-col"
            onClick={() => handleOpenThemeModal(theme)}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={theme.thumbNail || "/content/image/default_image2.png"}
                alt={theme.themeTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              <div className="text-sm font-bold line-clamp-1">{theme.themeTitle}</div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-600">가격</div>
                  <div className="text-sm font-semibold">{theme.themePrice?.toLocaleString() || '0'}원</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-600">인원</div>
                  <div className="text-sm font-semibold">
                    {theme.themeMinPlayer === theme.themeMaxPlayer 
                      ? `${theme.themeMinPlayer}인` 
                      : `${theme.themeMinPlayer}~${theme.themeMaxPlayer}인`}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // 하트 버튼 클릭 시 모달을 열고 'info' 탭 활성화
                      handleOpenThemeModal(theme, 'info');
                    }} 
                    className={`${likedThemes[theme.themeId] ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors`}
                  >
                    <Heart size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // 댓글 버튼 클릭 시 모달을 열고 'comments' 탭 활성화
                      handleOpenThemeModal(theme, 'comments');
                    }} 
                    className="text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
                <button 
                  onClick={(e) => handleShare(theme.themeId, e)} 
                  className="text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 테마 상세 모달 */}
      {selectedTheme && (
        <ThemeDetailModal 
          theme={selectedTheme} 
          isOpen={!!selectedTheme} 
          onClose={() => setSelectedTheme(null)} 
          userId={userId}
          initialTab={modalTab}
        />
      )}
    </>
  );
};

export default ProfileThemeGrid;
