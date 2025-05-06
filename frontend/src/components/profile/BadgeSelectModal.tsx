import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BadgeSelectModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  badgeList: string[];
  selectedBadge: string | null;
  setSelectedBadge: (badge: string | null) => void;
  isDark: boolean;
}

/**
 * 칭호 선택 모달 컴포넌트
 */
const BadgeSelectModal: React.FC<BadgeSelectModalProps> = ({
  showModal,
  setShowModal,
  badgeList,
  selectedBadge,
  setSelectedBadge,
  isDark,
}) => {
  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>보유한 칭호 선택</DialogTitle>
          <CardDescription>프로필에 표시할 칭호를 선택하세요</CardDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4">
          {badgeList.map((badge) => (
            <div
              key={badge}
              className={cn(
                "cursor-pointer text-center py-2 px-3 rounded-md justify-center text-sm transition-all",
                selectedBadge === badge
                  ? isDark
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : isDark
                    ? "bg-secondary hover:bg-indigo-900/50 border border-indigo-800/30"
                    : "bg-secondary hover:bg-indigo-100 border border-indigo-200"
              )}
              onClick={() => {
                setSelectedBadge(badge);
                setShowModal(false);
              }}
            >
              {badge}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedBadge(null);
              setShowModal(false);
            }}
          >
            칭호 미설정
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeSelectModal;
