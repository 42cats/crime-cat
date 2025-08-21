import React, { useState, useEffect } from 'react';
import { Lock, Eye, Calendar, Users, Clock, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import PasswordPromptModal from './PasswordPromptModal';

interface SecretEventCardProps {
  /** 이벤트 ID */
  eventId: string;
  /** 이벤트 카테고리 */
  category: string;
  /** 최대 참여자 수 */
  maxParticipants?: number;
  /** 비밀번호 힌트 여부 */
  hasPasswordHint?: boolean;
  /** 비밀번호 힌트 */
  passwordHint?: string;
  /** 카드 클릭 콜백 */
  onClick?: () => void;
  /** 인증 성공 콜백 */
  onUnlock?: (eventId: string, sessionId: string) => void;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 커스텀 클래스 */
  className?: string;
}

/**
 * 비밀 일정 카드 컴포넌트
 * 
 * 기능:
 * - 비밀 일정임을 나타내는 시각적 표시
 * - 제한된 정보만 표시 (보안)
 * - 비밀번호 입력 모달 연동
 * - 반응형 디자인
 * - 애니메이션 효과
 */
const SecretEventCard: React.FC<SecretEventCardProps> = ({
  eventId,
  category,
  maxParticipants,
  hasPasswordHint = false,
  passwordHint,
  onClick,
  onUnlock,
  compact = false,
  className = '',
}) => {
  const isMobile = useIsMobile();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 세션에서 인증 상태 확인
  useEffect(() => {
    checkVerificationStatus();
  }, [eventId]);

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

  const handleCardClick = () => {
    if (isVerified) {
      // 이미 인증된 경우 바로 이벤트 상세로
      onClick?.();
    } else {
      // 비인증 상태면 비밀번호 입력 모달 표시
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSuccess = (sessionId: string) => {
    setIsVerified(true);
    onUnlock?.(eventId, sessionId);
    setShowPasswordModal(false);
  };

  const getCategoryIcon = () => {
    // 카테고리별 아이콘 매핑
    const iconMap: { [key: string]: React.ReactNode } = {
      meeting: <Users className="w-4 h-4" />,
      event: <Calendar className="w-4 h-4" />,
      deadline: <Clock className="w-4 h-4" />,
      personal: <Shield className="w-4 h-4" />,
      default: <Calendar className="w-4 h-4" />,
    };

    return iconMap[category.toLowerCase()] || iconMap.default;
  };

  const getParticipantText = () => {
    if (!maxParticipants) {
      return "제한 없음";
    }
    return `최대 ${maxParticipants}명`;
  };

  return (
    <>
      <Card 
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-300
          ${isVerified 
            ? 'border-green-200 bg-green-50/50 hover:bg-green-100/50' 
            : 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50 hover:from-amber-100/50 hover:to-orange-100/50'
          }
          ${isHovered ? 'scale-[1.02] shadow-lg' : 'shadow-sm'}
          ${compact ? 'p-3' : 'p-4'}
          ${className}
        `}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-red-400" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23000" fill-opacity="0.1"%3E%3Cpath d="M10 0l10 10-10 10L0 10z"/%3E%3C/g%3E%3C/svg%3E')]" />
        </div>

        <CardHeader className={`relative z-10 ${compact ? 'pb-2' : 'pb-4'}`}>
          <CardTitle className={`flex items-center justify-between ${
            compact ? 'text-base' : (isMobile ? 'text-lg' : 'text-xl')
          }`}>
            <div className="flex items-center gap-2">
              <Lock className={`${
                isVerified ? 'text-green-600' : 'text-amber-600'
              } ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
              <span className={isVerified ? 'text-green-800' : 'text-amber-800'}>
                비밀 일정
              </span>
            </div>
            
            {isVerified && (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                <Eye className="w-3 h-3 mr-1" />
                인증됨
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className={`relative z-10 space-y-3 ${compact ? 'pt-0' : ''}`}>
          {/* 카테고리 정보 */}
          <div className="flex items-center gap-2">
            {getCategoryIcon()}
            <span className={`font-medium ${
              isVerified ? 'text-green-700' : 'text-amber-700'
            } ${isMobile ? 'text-sm' : 'text-base'}`}>
              {category}
            </span>
          </div>

          {/* 참여자 정보 */}
          <div className="flex items-center gap-2">
            <Users className={`w-4 h-4 ${
              isVerified ? 'text-green-600' : 'text-amber-600'
            }`} />
            <span className={`${
              isVerified ? 'text-green-700' : 'text-amber-700'
            } ${isMobile ? 'text-sm' : 'text-base'}`}>
              {getParticipantText()}
            </span>
          </div>

          {/* 힌트 여부 표시 */}
          {hasPasswordHint && (
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${
                isVerified ? 'text-green-600' : 'text-amber-500'
              }`} />
              <span className={`text-xs ${
                isVerified ? 'text-green-600' : 'text-amber-600'
              }`}>
                비밀번호 힌트 있음
              </span>
            </div>
          )}

          {/* 상태별 안내 메시지 */}
          <div className={`text-center p-3 rounded-lg ${
            isVerified 
              ? 'bg-green-100/50 border border-green-200'
              : 'bg-amber-100/50 border border-amber-200'
          }`}>
            {isVerified ? (
              <div className="space-y-1">
                <p className={`font-medium text-green-800 ${
                  isMobile ? 'text-sm' : 'text-base'
                }`}>
                  🔓 접근 가능
                </p>
                <p className={`text-green-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  클릭하여 일정 상세보기
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className={`font-medium text-amber-800 ${
                  isMobile ? 'text-sm' : 'text-base'
                }`}>
                  🔒 비밀번호 필요
                </p>
                <p className={`text-amber-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  클릭하여 비밀번호 입력
                </p>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 mt-4">
            <Button 
              variant={isVerified ? "default" : "outline"}
              size={compact || isMobile ? "sm" : "default"}
              className={`flex-1 ${
                isVerified 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'border-amber-300 text-amber-700 hover:bg-amber-50'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              {isVerified ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  상세보기
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  잠금 해제
                </>
              )}
            </Button>
          </div>
        </CardContent>

        {/* 잠금 오버레이 (비인증 상태) */}
        {!isVerified && (
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent pointer-events-none" />
        )}
      </Card>

      {/* 비밀번호 입력 모달 */}
      <PasswordPromptModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        eventId={eventId}
        eventTitle="비밀 일정"
        passwordHint={passwordHint}
        onSuccess={handlePasswordSuccess}
      />
    </>
  );
};

export default SecretEventCard;