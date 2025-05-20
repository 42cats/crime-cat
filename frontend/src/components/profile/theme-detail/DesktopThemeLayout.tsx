import React from 'react';
import { Heart, MessageSquare, Share2, FileText, ChevronsRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModalCommentList } from '../ModalCommentList';
import ThemeInfoContent from './ThemeInfoContent';
import ThemeImageSection from './ThemeImageSection';
import { ProfileDetailDto } from '@/api/profile/detail';
import { CrimesceneThemeSummeryDto } from '@/api/profile/themes';

// 탭 CSS 커스텀 스타일 - 정보/댓글 탭의 스타일을 반대로 적용
import './tab-custom.css';

interface DesktopThemeLayoutProps {
  theme: CrimesceneThemeSummeryDto;
  themeDetail: any;
  themeDetailLoading: boolean;
  profile: ProfileDetailDto | null;
  activeTab: 'info' | 'comments';
  setActiveTab: (tab: 'info' | 'comments') => void;
  isImageCollapsed: boolean;
  setIsImageCollapsed: (collapsed: boolean) => void;
  liked: boolean;
  isLikeLoading: boolean;
  hasPlayedGame: boolean;
  userId: string | undefined;
  formatPlayTime: (min: number, max: number) => string;
  handleLike: () => void;
  handleShare: () => void;
  handleLoginRequired: () => void;
  showRequestModal: () => void;
}

const DesktopThemeLayout: React.FC<DesktopThemeLayoutProps> = ({
  theme,
  themeDetail,
  themeDetailLoading,
  profile,
  activeTab,
  setActiveTab,
  isImageCollapsed,
  setIsImageCollapsed,
  liked,
  isLikeLoading,
  hasPlayedGame,
  userId,
  formatPlayTime,
  handleLike,
  handleShare,
  handleLoginRequired,
  showRequestModal
}) => {
  // 이미지 토글 핸들러
  const toggleImage = () => {
    setIsImageCollapsed(!isImageCollapsed);
  };

  return (
    <div className="flex flex-row h-full">
      {/* 이미지 섹션 */}
      <ThemeImageSection
        thumbNail={theme.thumbNail}
        title={theme.themeTitle}
        isCollapsed={isImageCollapsed}
        onToggleCollapse={toggleImage}
        isDesktop={true}
      />

      {/* 정보 섹션 */}
      <div className={`flex flex-col bg-white transition-all duration-300 ease-in-out ${isImageCollapsed ? 'w-full' : 'w-2/5'}`}>
        {/* 이미지 펼치기 버튼 - 이미지가 접혔을 때만 표시 */}
        {isImageCollapsed && (
          <button
            onClick={() => setIsImageCollapsed(false)}
            className="absolute top-12 left-4 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors z-50"
            title="이미지 펼치기"
          >
            <ChevronsRight size={18} />
          </button>
        )}
        
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

        {/* 탭 메뉴 및 콘텐츠 - 탭 커스텀 스타일 적용 */}
        <div className="flex flex-col flex-grow theme-tabs-custom">
          <Tabs 
            defaultValue={activeTab} 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'info' | 'comments')}
            className="flex flex-col flex-grow h-full"
          >
            <TabsList className="w-full grid grid-cols-2 sticky top-0 bg-white z-10">
              <TabsTrigger value="info">정보</TabsTrigger>
              <TabsTrigger value="comments">댓글</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="p-4 overflow-y-auto flex-grow">
              <div className="overflow-y-auto pb-20">
                <ThemeInfoContent
                  themeDetail={themeDetail}
                  themeDetailLoading={themeDetailLoading}
                  fallbackTheme={theme}
                  formatPlayTime={formatPlayTime}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="comments" className="overflow-y-auto flex-grow">
              <div className="overflow-y-auto pb-20">
                <ModalCommentList 
                  gameThemeId={theme.themeId}
                  currentUserId={userId}
                  hasPlayedGame={hasPlayedGame}
                  onLoginRequired={handleLoginRequired}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 액션 버튼 - 항상 하단에 고정 */}
        <div className="border-t p-4 bg-white mt-auto flex-shrink-0">
          <div className="flex justify-between mb-2 items-center">
            <div className="flex space-x-4 w-full justify-start">
              <button 
                className={`flex items-center gap-1 text-gray-800 ${liked ? 'text-red-500' : 'hover:text-red-500'} transition-colors`}
                onClick={handleLike}
                disabled={isLikeLoading}
              >
                <Heart size={24} className={liked ? 'fill-red-500' : ''} />
              </button>
              <button 
                className={`text-gray-800 ${activeTab === 'info' ? 'text-blue-500' : 'hover:text-blue-500'} transition-colors`}
                onClick={() => setActiveTab('info')}
              >
                <Info size={24} />
              </button>
              <button 
                className={`text-gray-800 ${activeTab === 'comments' ? 'text-blue-500' : 'hover:text-blue-500'} transition-colors`}
                onClick={() => setActiveTab('comments')}
              >
                <MessageSquare size={24} />
              </button>
              <button 
                className="text-gray-800 hover:text-green-500 transition-colors"
                onClick={handleShare}
              >
                <Share2 size={24} />
              </button>
            </div>
            <div className="flex gap-2">
              {userId && !hasPlayedGame && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showRequestModal}
                  className="text-xs px-2 py-1"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  기록요청
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                className="text-xs px-2 py-1"
                onClick={() => window.open(`/themes/crimescene/${theme.themeId}`, '_blank')}
              >
                상세페이지
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopThemeLayout;