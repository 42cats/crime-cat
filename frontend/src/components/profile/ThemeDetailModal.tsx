import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Share2, X, Send, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from "@/hooks/useAuth";
import { themesService } from "@/api/themesService";
import { getProfileDetail, ProfileDetailDto } from '@/api/profile/detail';
import { CrimesceneThemeSummeryDto } from '@/api/profile/themes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { gameHistoryService } from "@/api/gameHistoryService";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// 분리된 컴포넌트들 임포트
import { MobileThemeLayout, DesktopThemeLayout } from './theme-detail';

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
  const [isImageCollapsed, setIsImageCollapsed] = useState(false);
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
        <DialogContent className="max-w-5xl w-[95%] md:w-full bg-white rounded-lg p-0 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">테마 상세 정보</DialogTitle>
          
          {/* 모바일/데스크탑 레이아웃 컨테이너 */}
          <div className="h-[85vh] md:h-[80vh] overflow-hidden flex flex-col">
            {/* 상단 컨트롤 버튼 (닫기, 공유) */}
            <div className="absolute top-4 right-4 flex gap-2 z-20">
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

            {/* 반응형 레이아웃: 모바일과 데스크탑 */}
            <div className="block md:hidden">
              {/* 모바일 레이아웃 */}
              <MobileThemeLayout
                theme={theme}
                themeDetail={themeDetail}
                themeDetailLoading={themeDetailLoading}
                profile={profile}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                liked={liked}
                isLikeLoading={isLikeLoading}
                hasPlayedGame={hasPlayedGame}
                userId={user?.id}
                formatPlayTime={formatPlayTime}
                handleLike={handleLike}
                handleShare={handleShare}
                handleLoginRequired={handleLoginRequired}
                showRequestModal={() => setShowRequestModal(true)}
              />
            </div>

            <div className="hidden md:block h-full">
              {/* 데스크탑 레이아웃 */}
              <DesktopThemeLayout
                theme={theme}
                themeDetail={themeDetail}
                themeDetailLoading={themeDetailLoading}
                profile={profile}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isImageCollapsed={isImageCollapsed}
                setIsImageCollapsed={setIsImageCollapsed}
                liked={liked}
                isLikeLoading={isLikeLoading}
                hasPlayedGame={hasPlayedGame}
                userId={user?.id}
                formatPlayTime={formatPlayTime}
                handleLike={handleLike}
                handleShare={handleShare}
                handleLoginRequired={handleLoginRequired}
                showRequestModal={() => setShowRequestModal(true)}
              />
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