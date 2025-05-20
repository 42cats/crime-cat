import React from 'react';
import { Heart, MessageSquare, Share2, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModalCommentList } from '../ModalCommentList';
import ThemeInfoContent from './ThemeInfoContent';
import ThemeImageSection from './ThemeImageSection';
import { ProfileDetailDto } from '@/api/profile/detail';
import { CrimesceneThemeSummeryDto } from '@/api/profile/themes';

// 탭 CSS 커스텀 스타일 - 정보/댓글 탭의 스타일을 반대로 적용
import './tab-custom.css';

interface MobileThemeLayoutProps {
  theme: CrimesceneThemeSummeryDto;
  themeDetail: any;
  themeDetailLoading: boolean;
  profile: ProfileDetailDto | null;
  activeTab: 'info' | 'comments';
  setActiveTab: (tab: 'info' | 'comments') => void;
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

const MobileThemeLayout: React.FC<MobileThemeLayoutProps> = ({
  theme,
  themeDetail,
  themeDetailLoading,
  profile,
  activeTab,
  setActiveTab,
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
  return (
    <div className="flex flex-col h-full">
      {/* 이미지 섹션 - 작은 고정 크기 사용 */}
      <div className="flex-shrink-0">
        <ThemeImageSection
          thumbNail={theme.thumbNail}
          title={theme.themeTitle}
          isCollapsed={false}
          onToggleCollapse={() => {}}
          isDesktop={false}
        />
      </div>

      {/* 프로필 정보 */}
      <div className="flex items-center p-4 border-b flex-shrink-0">
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

      {/* 탭 컨텐츠 - 플렉스 그로우로 남은 공간 차지 */}
      <div className="flex-grow overflow-hidden flex flex-col theme-tabs-custom">
        <Tabs 
          defaultValue={activeTab} 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'info' | 'comments')}
          className="w-full flex flex-col h-full"
        >
          <TabsList className="w-full grid grid-cols-2 sticky top-0 bg-white z-10 flex-shrink-0">
            <TabsTrigger value="info">정보</TabsTrigger>
            <TabsTrigger value="comments">댓글</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="flex-grow overflow-y-auto p-4 pb-24">
            <ThemeInfoContent
              themeDetail={themeDetail}
              themeDetailLoading={themeDetailLoading}
              fallbackTheme={theme}
              formatPlayTime={formatPlayTime}
            />
          </TabsContent>
          
          <TabsContent value="comments" className="flex-grow overflow-y-auto pb-24">
            <ModalCommentList 
              gameThemeId={theme.themeId}
              currentUserId={userId}
              hasPlayedGame={hasPlayedGame}
              onLoginRequired={handleLoginRequired}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* 하단 고정 액션 버튼 */}
      <div className="fixed bottom-0 left-0 w-full border-t p-4 bg-white z-20">
        <div className="flex justify-between mb-2 items-center">
          <div className="flex space-x-4 w-full justify-center">
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
  );
};

export default MobileThemeLayout;