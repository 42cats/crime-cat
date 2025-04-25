import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Gift } from 'lucide-react';
import { couponService } from '@/api/couponService';
import { useToast } from '@/hooks/useToast';

interface Props {
  user: {
    id: string;
    nickname: string;
    profile_image_path?: string;
    setting?: {
      notifyByEmail: boolean;
      notifyByDiscord: boolean;
    };
    social_links?: {
      instagram?: string;
      x?: string;
      openkakao?: string;
    };
    bio?: string;
    title?: string;
    badge?: string;
    snowflake?: string;
    last_login_at?: string;
    point?: number;
  };
}

export const ProfileCard: React.FC<Props> = ({ user }) => {
  const [isCouponModalOpen, setCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [point, setPoint] = useState(user.point);
  const { toast } = useToast();

  const handleApplyCoupon = async () => {
    try {
      const res = await couponService.requestCoupon(user.id, couponCode);
      setPoint(res.point);
      toast({
        title: '쿠폰 적용 완료 🎉',
        description: `적용된 포인트: ${res.point}P`,
      });
      setCouponModalOpen(false);
      setCouponCode('');
    } catch (error) {
      toast({
        title: '쿠폰을 사용할 수 없습니다.',
        description: '올바른 쿠폰 코드인지 확인해주세요.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>내 프로필</CardTitle>
          <CardDescription>회원님의 전체 프로필 정보입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.profile_image_path && (
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto">
              <img
                src={user.profile_image_path}
                alt="프로필 이미지"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileField label="닉네임" value={user.nickname} />
            <ProfileField label="타이틀" value={user.title} />
            <ProfileField label="뱃지" value={<Badge>{user.badge || '없음'}</Badge>} />
            <ProfileField
              label="포인트"
              value={
                <div className="flex items-center gap-2">
                  {point ?? '-'}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-5 h-5"
                    onClick={() => setCouponModalOpen(true)}
                  >
                    <Gift className="w-4 h-4" />
                  </Button>
                </div>
              }
            />
            <ProfileField
              label="마지막 로그인"
              value={user.last_login_at ? formatDate(user.last_login_at) : '-'}
            />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">자기소개</p>
            <p className="mt-1 text-base whitespace-pre-line">{user.bio || '-'}</p>
          </div>

          {user.setting && (
            <div>
              <p className="text-sm text-muted-foreground">알림 설정</p>
              <p className="mt-1 text-base">
                이메일: {user.setting.notifyByEmail ? 'O' : 'X'}, 디스코드: {user.setting.notifyByDiscord ? 'O' : 'X'}
              </p>
            </div>
          )}

          {user.social_links && (
            <div>
              <p className="text-sm text-muted-foreground">소셜 링크</p>
              <ul className="mt-1 space-y-1 text-base">
                {user.social_links.instagram && <li>Instagram: {user.social_links.instagram}</li>}
                {user.social_links.x && <li>X: {user.social_links.x}</li>}
                {user.social_links.openkakao && <li>Open Kakao: {user.social_links.openkakao}</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 쿠폰 입력 모달 */}
      <Dialog open={isCouponModalOpen} onOpenChange={setCouponModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>쿠폰 코드 입력</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="쿠폰 코드를 입력하세요"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <Button className="w-full" onClick={handleApplyCoupon}>
              등록하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ProfileField: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    {typeof value === 'string' || typeof value === 'number' ? (
      <p className="mt-1 text-base">{value || '-'}</p>
    ) : (
      <div className="mt-1 text-base">{value}</div>
    )}
  </div>
);