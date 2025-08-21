import React, { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Eye, Users, Calendar, Clock, Shield, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import PasswordPromptModal from './PasswordPromptModal';

interface SecretEventPreviewProps {
  /** 이벤트 ID */
  eventId: string;
  /** 미리보기 데이터 로드 완료 콜백 */
  onDataLoaded?: (previewData: SecretEventPreviewData) => void;
  /** 인증 성공 콜백 */
  onUnlock?: (eventId: string, sessionId: string) => void;
  /** 커스텀 클래스 */
  className?: string;
}

interface SecretEventPreviewData {
  id: string;
  title: string;
  category: string;
  isSecret: boolean;
  hasPasswordHint: boolean;
  passwordHint?: string;
  participantCount: string;
  maxParticipants?: number;
}

/**
 * 비밀 일정 미리보기 컴포넌트
 * 
 * 기능:
 * - 비인증 상태에서 볼 수 있는 제한된 정보 표시
 * - 비밀번호 힌트 표시
 * - 잠금 해제 UI
 * - 로딩 상태 처리
 * - 에러 핸들링
 */
const SecretEventPreview: React.FC<SecretEventPreviewProps> = ({
  eventId,
  onDataLoaded,
  onUnlock,
  className = '',
}) => {
  const isMobile = useIsMobile();
  const [previewData, setPreviewData] = useState<SecretEventPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    loadPreviewData();
    checkVerificationStatus();
  }, [eventId]);

  const loadPreviewData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/secret-schedule/preview/${eventId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPreviewData(result.event);
          onDataLoaded?.(result.event);
        } else {
          setError(result.message || '미리보기 데이터를 불러올 수 없습니다.');
        }
      } else if (response.status === 404) {
        setError('이벤트를 찾을 수 없습니다.');
      } else {
        setError('서버 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('미리보기 데이터 로드 실패:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch(`/api/v1/secret-schedule/verify-status/${eventId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setIsVerified(result.verified);
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
    }
  };

  const handlePasswordSuccess = (sessionId: string) => {
    setIsVerified(true);
    onUnlock?.(eventId, sessionId);
    setShowPasswordModal(false);
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      meeting: <Users className="w-4 h-4" />,
      event: <Calendar className="w-4 h-4" />,
      deadline: <Clock className="w-4 h-4" />,
      personal: <Shield className="w-4 h-4" />,
      default: <Calendar className="w-4 h-4" />,
    };

    return iconMap[category?.toLowerCase()] || iconMap.default;
  };

  if (loading) {
    return (
      <Card className={`border-amber-200 bg-amber-50/30 ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50/30 ${className}`}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={loadPreviewData}
            className="w-full mt-4"
            size={isMobile ? "sm" : "default"}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!previewData) {
    return null;
  }

  return (
    <>
      <Card className={`
        relative overflow-hidden border-2 transition-all duration-300
        ${isVerified 
          ? 'border-green-300 bg-green-50/50' 
          : 'border-amber-300 bg-gradient-to-br from-amber-50/50 to-orange-50/50'
        }
        ${className}
      `}>
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-red-400" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23000" fill-opacity="0.1"%3E%3Cpath d="M10 0l10 10-10 10L0 10z"/%3E%3C/g%3E%3C/svg%3E')]" />
        </div>

        <CardHeader className="relative z-10 pb-4">
          <CardTitle className={`flex items-center justify-between ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isVerified ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                <Lock className={`w-5 h-5 ${
                  isVerified ? 'text-green-600' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <h3 className={`font-bold ${
                  isVerified ? 'text-green-800' : 'text-amber-800'
                }`}>
                  {previewData.title}
                </h3>
                <p className={`text-sm ${
                  isVerified ? 'text-green-600' : 'text-amber-600'
                } mt-1`}>
                  비밀 일정
                </p>
              </div>
            </div>
            
            {isVerified && (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                <Eye className="w-3 h-3 mr-1" />
                인증됨
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 카테고리 */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
              {getCategoryIcon(previewData.category)}
              <div>
                <p className={`font-medium ${
                  isVerified ? 'text-green-700' : 'text-amber-700'
                } ${isMobile ? 'text-sm' : 'text-base'}`}>
                  카테고리
                </p>
                <p className={`${
                  isVerified ? 'text-green-600' : 'text-amber-600'
                } ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {previewData.category}
                </p>
              </div>
            </div>

            {/* 참여자 정보 */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
              <Users className={`w-4 h-4 ${
                isVerified ? 'text-green-600' : 'text-amber-600'
              }`} />
              <div>
                <p className={`font-medium ${
                  isVerified ? 'text-green-700' : 'text-amber-700'
                } ${isMobile ? 'text-sm' : 'text-base'}`}>
                  참여자
                </p>
                <p className={`${
                  isVerified ? 'text-green-600' : 'text-amber-600'
                } ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {previewData.participantCount}
                  {previewData.maxParticipants && ` / 최대 ${previewData.maxParticipants}명`}
                </p>
              </div>
            </div>
          </div>

          {/* 비밀번호 힌트 */}
          {previewData.hasPasswordHint && previewData.passwordHint && (
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className={`font-medium text-blue-800 ${
                      isMobile ? 'text-sm' : 'text-base'
                    }`}>
                      비밀번호 힌트
                    </h4>
                    <p className={`text-blue-700 mt-2 ${
                      isMobile ? 'text-sm' : 'text-base'
                    }`}>
                      "{previewData.passwordHint}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 상태별 안내 메시지 */}
          <div className={`text-center p-4 rounded-lg border-2 ${
            isVerified 
              ? 'bg-green-100/50 border-green-300'
              : 'bg-amber-100/50 border-amber-300'
          }`}>
            {isVerified ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Eye className="w-5 h-5 text-green-600" />
                  <p className={`font-bold text-green-800 ${
                    isMobile ? 'text-lg' : 'text-xl'
                  }`}>
                    접근 가능
                  </p>
                </div>
                <p className={`text-green-700 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  이제 이 비밀 일정의 모든 정보를 확인할 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <p className={`font-bold text-amber-800 ${
                    isMobile ? 'text-lg' : 'text-xl'
                  }`}>
                    잠금 상태
                  </p>
                </div>
                <p className={`text-amber-700 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  이 일정의 상세 정보를 보려면 비밀번호가 필요합니다.
                </p>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          {!isVerified && (
            <div className="space-y-3">
              <Button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                size={isMobile ? "sm" : "default"}
              >
                <Lock className="w-4 h-4 mr-2" />
                비밀번호 입력하기
              </Button>
              
              <p className={`text-center text-muted-foreground ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>
                🔒 모든 접근 시도는 보안을 위해 기록됩니다
              </p>
            </div>
          )}
        </CardContent>

        {/* 잠금 오버레이 */}
        {!isVerified && (
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 to-transparent pointer-events-none" />
        )}
      </Card>

      {/* 비밀번호 입력 모달 */}
      <PasswordPromptModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        eventId={eventId}
        eventTitle={previewData.title}
        passwordHint={previewData.passwordHint}
        onSuccess={handlePasswordSuccess}
      />
    </>
  );
};

export default SecretEventPreview;