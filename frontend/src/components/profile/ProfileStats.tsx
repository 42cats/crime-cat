import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gift } from "lucide-react";
import { couponService } from '@/api/misc';
import { useToast } from "@/hooks/useToast";
import type { UserProfile } from "@/types/profile";

interface ProfileStatsProps {
  user: UserProfile;
  onPointUpdate?: (newPoint: number) => void;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ 
  user, 
  onPointUpdate 
}) => {
  const [isCouponModalOpen, setCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const { toast } = useToast();

  const handleApplyCoupon = async () => {
    try {
      const res = await couponService.requestCoupon(user.id, couponCode);
      onPointUpdate?.(res.point);
      toast({
        title: "쿠폰 적용 완료 🎉",
        description: `적용된 포인트: ${res.point}P`,
      });
      setCouponModalOpen(false);
      setCouponCode("");
    } catch (error) {
      toast({
        title: "쿠폰을 사용할 수 없습니다.",
        description: "올바른 쿠폰 코드인지 확인해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">포인트</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base">{user.point ?? "-"}</span>
            <Button
              size="icon"
              variant="ghost"
              className="w-5 h-5"
              onClick={() => setCouponModalOpen(true)}
            >
              <Gift className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

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
