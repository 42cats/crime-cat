import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CrimesceneThemeSummeryDto } from '@/api/profile/themes';
import { getProfileDetail, ProfileDetailDto } from '@/api/profile/detail';
import {
  Heart,
  MessageSquare,
  Share2,
  X,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ModalCommentList } from './ModalCommentList';
import { useAuth } from "@/hooks/useAuth";
import { themesService } from "@/api/themesService";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { gameHistoryService } from "@/api/gameHistoryService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ThemeDetailModalProps {
  theme: CrimesceneThemeSummeryDto;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: 'info' | 'comments';
}

type ModalTab = 'info' | 'comments';

const ThemeDetailModal: React.FC<ThemeDetailModalProps> = ({
  theme,
  isOpen,
  onClose,
  userId,
  initialTab = 'info'
}) => {
  const [profile, setProfile] = useState<ProfileDetailDto | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // 프로필 정보 로드
  useEffect(() => {
    if (isOpen && userId) {
      getProfileDetail(userId)
        .then(data => setProfile(data))
        .catch(err => console.error("프로필 상세 정보 로드 실패:", err));
    }
  }, [isOpen, userId]);

  // 테마 좋아요 상태 확인
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (isOpen && theme.themeId && isAuthenticated) {
        try {
          const likeStatus = await themesService.getLikeStatus(theme.themeId);
          setLiked(likeStatus);
        } catch (error) {
          console.error("좋아요 상태 확인 중 오류 발생:", error);
        }
      }
    };

    // 게임 플레이 여부 확인
    const checkGamePlayed = async () => {
      if (isOpen && theme.themeId && isAuthenticated) {
        try {
          const played = await gameHistoryService.checkPlayTheme(theme.themeId);
          setHasPlayedGame(played);
        } catch (error) {
          console.error("게임 플레이 여부 확인 중 오류 발생:", error);
          setHasPlayedGame(false);
        }
      }
    };

    checkLikeStatus();
    checkGamePlayed();
  }, [isOpen, theme.themeId, isAuthenticated]);

  const handleShare = async () => {
    try {
      const themeUrl = `${window.location.origin}/themes/crimescene/${theme.themeId}`;
      await navigator.clipboard.writeText(themeUrl);
      toast.success("테마 링크가 복사되었습니다");
    } catch (error) {
      toast.error("링크 복사에 실패했습니다");
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }

    setIsLikeLoading(true);
    try {
      if (liked) {
        await themesService.cancelLike(theme.themeId);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await themesService.setLike(theme.themeId);
        setLikeCount(prev => prev + 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error("좋아요 처리 중 오류 발생:", error);
      toast.error("좋아요 처리 중 문제가 발생했습니다");
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleLoginRequired = () => {
    setShowLoginDialog(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-5xl w-full bg-white rounded-lg overflow-hidden p-0">
          <DialogTitle className="sr-only">테마 상세 정보</DialogTitle>
          
          <div className="relative flex flex-col md:flex-row max-h-[90vh]">
            {/* 이미지 */}
            <div className="md:w-3/5 bg-black flex items-center justify-center">
              <img
                src={theme.thumbNail || "/content/image/default_image2.png"}
                alt={theme.themeTitle}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            {/* 테마 정보 섹션 */}
            <div className="md:w-2/5 flex flex-col max-h-[90vh] bg-white">
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

              {/* 탭 메뉴 */}
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger 
                    value="info" 
                    onClick={() => setActiveTab('info')}
                    className={activeTab === 'info' ? 'border-b-2 border-primary' : ''}
                  >
                    정보
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comments" 
                    onClick={() => setActiveTab('comments')}
                    className={activeTab === 'comments' ? 'border-b-2 border-primary' : ''}
                  >
                    댓글
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="p-4 flex-grow overflow-y-auto">
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
                        onClick={() => window.open(`/themes/crimescene/${theme.themeId}`, '_blank')}
                      >
                        테마 상세 페이지로 이동
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="comments" className="h-full overflow-hidden">
                  <div className="h-full flex flex-col">
                    <ModalCommentList 
                      gameThemeId={theme.themeId}
                      currentUserId={user?.id}
                      hasPlayedGame={hasPlayedGame}
                      onLoginRequired={handleLoginRequired}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* 액션 버튼 - 항상 표시 */}
              <div className="border-t p-4">
                <div className="flex justify-between mb-2">
                  <div className="flex space-x-4">
                    <button 
                      className={`flex items-center gap-1 text-gray-800 ${liked ? 'text-red-500' : 'hover:text-red-500'} transition-colors`}
                      onClick={handleLike}
                      disabled={isLikeLoading}
                    >
                      <Heart size={24} className={liked ? 'fill-red-500' : ''} />
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
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 로그인 필요 다이얼로그 */}
      <AlertDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
            <AlertDialogDescription>
              이 기능을 사용하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLoginDialog(false);
                window.location.href = '/login';
              }}
            >
              로그인 하러 가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ThemeDetailModal;