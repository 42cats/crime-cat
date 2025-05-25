import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface TeamCreationFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (teamName: string) => Promise<void>;
}

const TeamCreationForm: React.FC<TeamCreationFormProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
}) => {
  const [teamName, setTeamName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(teamName);
      setTeamName("");
      onOpenChange(false);
    } catch (error) {
      console.error("팀 생성 중 오류 발생:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 팀 만들기</DialogTitle>
            <DialogDescription>
              새로운 팀을 생성하여 멤버들과 함께 활동해보세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">팀 이름</Label>
              <Input
                id="teamName"
                placeholder="팀 이름을 입력하세요"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                autoFocus
                required
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                팀 이름은 최대 30자까지 입력할 수 있습니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!teamName.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                "팀 생성하기"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamCreationForm;