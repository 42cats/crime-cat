import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';

interface PasswordPromptModalProps {
  /** 모달 표시 여부 */
  open: boolean;
  /** 모달 닫기 콜백 */
  onClose: () => void;
  /** 이벤트 ID */
  eventId: string;
  /** 이벤트 제목 */
  eventTitle?: string;
  /** 비밀번호 힌트 */
  passwordHint?: string;
  /** 비밀번호 검증 성공 콜백 */
  onSuccess: (sessionId: string) => void;
  /** 로딩 상태 */
  loading?: boolean;
}

interface VerificationAttempt {
  timestamp: Date;
  success: boolean;
  message: string;
}

/**
 * 비밀 일정 비밀번호 입력 모달
 * 
 * 기능:
 * - 비밀번호 입력 및 표시/숨기기
 * - 실시간 비밀번호 복잡도 검증
 * - Rate Limiting 상태 표시
 * - 시도 기록 표시
 * - 반응형 디자인
 */
const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  open,
  onClose,
  eventId,
  eventTitle = "비밀 일정",
  passwordHint,
  onSuccess,
  loading = false,
}) => {
  const isMobile = useIsMobile();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [attempts, setAttempts] = useState<VerificationAttempt[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<{
    valid: boolean;
    message: string;
  }>({ valid: false, message: '' });

  // 비밀번호 복잡도 실시간 검증
  useEffect(() => {
    const validatePassword = async () => {
      if (!password.trim()) {
        setPasswordStrength({ valid: false, message: '' });
        return;
      }

      try {
        const response = await fetch('/api/v1/secret-schedule/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        });

        if (response.ok) {
          const result = await response.json();
          setPasswordStrength({
            valid: result.valid,
            message: result.message,
          });
        }
      } catch (error) {
        console.error('비밀번호 검증 실패:', error);
      }
    };

    const debounceTimer = setTimeout(validatePassword, 300);
    return () => clearTimeout(debounceTimer);
  }, [password]);

  // 모달이 열릴 때 상태 초기화
  useEffect(() => {
    if (open) {
      setPassword('');
      setError(null);
      setRateLimited(false);
      setShowPassword(false);
      setIsSubmitting(false);
      setAttempts([]);
      setPasswordStrength({ valid: false, message: '' });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    if (!passwordStrength.valid) {
      setError(passwordStrength.message);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/secret-schedule/verify/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();
      
      // 시도 기록 추가
      const attempt: VerificationAttempt = {
        timestamp: new Date(),
        success: result.success,
        message: result.message,
      };
      setAttempts(prev => [attempt, ...prev.slice(0, 4)]); // 최근 5개만 유지

      if (response.status === 429) {
        // Rate Limiting
        setRateLimited(true);
        setError(result.message || '너무 많은 시도로 인해 일시적으로 차단되었습니다.');
      } else if (result.success) {
        // 성공
        onSuccess(result.sessionId);
        onClose();
      } else {
        // 실패
        setError(result.message || '비밀번호가 올바르지 않습니다.');
        setPassword(''); // 비밀번호 초기화
      }
    } catch (error) {
      console.error('비밀번호 검증 요청 실패:', error);
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttemptIcon = (attempt: VerificationAttempt) => {
    if (attempt.success) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatAttemptTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-sm' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader className="space-y-3">
          <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            <Lock className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-primary`} />
            비밀 일정 접근
          </DialogTitle>
          <DialogDescription className={`${isMobile ? 'text-sm' : 'text-base'}`}>
            "{eventTitle}"에 접근하려면 비밀번호를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        {/* 비밀번호 힌트 카드 */}
        {passwordHint && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>힌트</p>
                  <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>
                    {passwordHint}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <Label htmlFor="password" className={isMobile ? 'text-sm' : 'text-base'}>
              비밀번호
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className={`pr-10 ${isMobile ? 'text-sm' : ''}`}
                disabled={isSubmitting || loading || rateLimited}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting || loading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* 비밀번호 복잡도 표시 */}
            {password && passwordStrength.message && (
              <p className={`text-xs ${
                passwordStrength.valid ? 'text-green-600' : 'text-amber-600'
              }`}>
                {passwordStrength.message}
              </p>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <Alert variant={rateLimited ? "destructive" : "default"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className={isMobile ? 'text-sm' : ''}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Rate Limiting 안내 */}
          {rateLimited && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <p className={`text-amber-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    보안을 위해 일시적으로 차단되었습니다. 잠시 후 다시 시도해주세요.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 시도 기록 */}
          {attempts.length > 0 && (
            <div className="space-y-2">
              <Label className={`${isMobile ? 'text-sm' : 'text-base'}`}>최근 시도 기록</Label>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {attempts.map((attempt, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded border bg-muted/20"
                  >
                    <div className="flex items-center gap-2">
                      {getAttemptIcon(attempt)}
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                        attempt.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {attempt.message}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatAttemptTime(attempt.timestamp)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting || loading}
              className="flex-1"
              size={isMobile ? "sm" : "default"}
            >
              취소
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || loading || !password.trim() || rateLimited}
              className="flex-1"
              size={isMobile ? "sm" : "default"}
            >
              {isSubmitting || loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>확인 중...</span>
                </div>
              ) : (
                '확인'
              )}
            </Button>
          </div>
        </form>

        {/* 보안 안내 */}
        <div className="text-center pt-2 border-t">
          <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
            🔒 모든 접근 시도는 보안을 위해 기록됩니다
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordPromptModal;