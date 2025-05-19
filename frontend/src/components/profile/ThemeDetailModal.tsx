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
  Info,
  FileText,
  Send
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UTCToKST } from '@/lib/dateFormat';

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
  // 프로필 정보
  const [profile, setProfile] = useState<ProfileDetailDto | null>(null);
  
  // 테마 상세 정보
  const [themeDetail, setThemeDetail] = useState<any>(null);
  const [themeDetailLoading, setThemeDetailLoading] = useState(false);
  
  // UI 상태
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
  // 기록 요청 관련 상태
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  
  const { user, isAuthenticated } = useAuth();

  // 프로필 정보 로드
  useEffect(() => {
    if (isOpen && userId) {
      getProfileDetail(userId)
        .then(data => setProfile(data))
        .catch(err => console.error("프로필 상세 정보 로드 실패:", err));
    }
  }, [isOpen, userId]);
  
  // 테마 상세 정보 불러오기
  useEffect(() => {
    const fetchThemeDetail = async () => {
      if (isOpen && theme.themeId) {
        setThemeDetailLoading(true);
        try {
          const data = await themesService.getThemeById(theme.themeId);
          setThemeDetail(data);
          // 메타데이터 업데이트
          if (data.recommendations !== undefined) {
            setLikeCount(data.recommendations);
          }
        } catch (error) {
          console.error("테마 상세 정보 불러오기 실패:", error);
        } finally {
          setThemeDetailLoading(false);
        }
      }
    };

    fetchThemeDetail();
  }, [isOpen, theme.themeId]);

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

  // 시간 형식 변환 함수
  const formatPlayTime = (min: number, max: number): string => {
    const toHourText = (m: number) => {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      return `${h > 0 ? `${h}시간` : ""}${mm > 0 ? ` ${mm}분` : ""}`.trim();
    };
    
    return min === max
        ? toHourText(min)
        : `${toHourText(min)} ~ ${toHourText(max)}`;
  };

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
  
  const handleRequestGame = async () => {
    if (!requestMessage.trim()) {
      toast.error("메시지를 입력해주세요");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const result = await gameHistoryService.requestGameRecord({
        gameThemeId: theme.themeId,
        message: requestMessage,
      });

      // 백엔드 메시지에 따라 UI 처리
      if (result.message === "요청이 발송되었습니다.") {
        toast.success("기록 요청이 성공적으로 전송되었습니다.");
      } else {
        toast(result.message);
      }

      setShowRequestModal(false);
      setRequestMessage("");
    } catch (error) {
      toast.error("요청 전송 실패. 다시 시도해주세요.");
    } finally {
      setIsSubmittingRequest(false);
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
              <Tabs defaultValue={initialTab} className="w-full">
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
                  {themeDetailLoading ? (
                    <div className="flex justify-center py-4">
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : themeDetail ? (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold mb-4">
                        {themeDetail.title}
                      </h3>
                      
                      {themeDetail.summary && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500">설명</h4>
                          <p className="text-sm whitespace-pre-line">{themeDetail.summary}</p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">카테고리</h4>
                        <Badge variant="secondary">{themeDetail.type}</Badge>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">가격</h4>
                        <p>{themeDetail.price?.toLocaleString()}원</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">인원</h4>
                        <p>
                          {themeDetail.playersMin === themeDetail.playersMax 
                            ? `${themeDetail.playersMin}인` 
                            : `${themeDetail.playersMin}~${themeDetail.playersMax}인`}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">플레이 시간</h4>
                        <p>
                          {formatPlayTime(themeDetail.playTimeMin, themeDetail.playTimeMax)}
                        </p>
                      </div>
                      
                      {themeDetail.tags?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500">태그</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {themeDetail.tags.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="outline">#{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2 mt-4">
                        {user?.id && !hasPlayedGame && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRequestModal(true)}
                            className="text-sm"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            기록 요청
                          </Button>
                        )}
                        
                        <Button
                          variant="default"
                          size="sm"
                          className="text-sm"
                          onClick={() => window.open(`/themes/crimescene/${theme.themeId}`, '_blank')}
                        >
                          테마 상세 페이지로 이동
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold mb-4">
                        {theme.themeTitle}
                      </h3>
                      
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
                  )}
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

      {/* 기록 요청 모달 */}
      <Dialog
        open={showRequestModal}
        onOpenChange={(open) => {
          setShowRequestModal(open);
          if (!open) setRequestMessage("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle>기록 요청</DialogTitle>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request-message">요청 메시지</Label>
              <Textarea
                id="request-message"
                placeholder="기록 요청 내용을 작성해주세요..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowRequestModal(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleRequestGame}
              disabled={isSubmittingRequest || !requestMessage.trim()}
            >
              {isSubmittingRequest ? (
                <>전송 중...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  요청 전송
                </>
              )}
            </Button>
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