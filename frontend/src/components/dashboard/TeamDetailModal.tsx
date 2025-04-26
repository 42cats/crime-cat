import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Team } from "@/lib/types";
import { teamsService } from "@/api/teamsService";
import { useToast } from "@/hooks/useToast"; // ✅ 토스트 훅 추가
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";

interface Props {
  team: Team;
  onClose: () => void;
  onUpdated: () => void;
}

const TeamDetailModal: React.FC<Props> = ({ team, onClose, onUpdated }) => {
  const { toast } = useToast(); // ✅ 토스트 사용
  const [newMemberName, setNewMemberName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null); // ✅ 삭제할 멤버 ID 저장

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    try {
      await teamsService.updateTeamMember(team.id, { name: newMemberName });
      setNewMemberName("");
      onUpdated();
      toast({ title: "멤버 추가 완료", description: `${newMemberName} 님이 추가되었습니다.` });
    } catch (error) {
      console.error("멤버 추가 실패:", error);
      toast({ title: "오류", description: "멤버 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await teamsService.deleteTeamMember(team.id, [{ id: memberId }]);
      setDeleteTarget(null);
      onUpdated();
      toast({ title: "멤버 삭제 완료", description: `멤버가 삭제되었습니다.` });
    } catch (error) {
      console.error("멤버 삭제 실패:", error);
      toast({ title: "오류", description: "멤버 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{team.name} - 팀 상세</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 멤버 추가 */}
          <div className="flex gap-2">
            <Input
              placeholder="추가할 멤버 이름"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
            />
            <Button onClick={handleAddMember} disabled={!newMemberName.trim()}>
              추가
            </Button>
          </div>

          {/* 멤버 목록 */}
          <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
            {team.members && team.members.length > 0 ? (
              team.members.map((member) => (
                <Card key={member.id} className="flex justify-between items-center p-4">
                  <div>
                    <CardTitle className="text-sm">{member.name}</CardTitle>
                    <CardContent className="text-xs text-muted-foreground">
                      {member.userId ? `User ID: ${member.userId}` : "User ID 없음"}
                    </CardContent>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteTarget(member.id)} // ✅ 삭제 대상 설정
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground">팀에 등록된 멤버가 없습니다.</p>
            )}
          </div>

          {/* 닫기 버튼 */}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>

        {/* 삭제 확인 다이얼로그 */}
        {deleteTarget && (
          <AlertDialog open={true} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                  취소
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteMember(deleteTarget)}>
                  삭제
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamDetailModal;