import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Team, TeamMember } from "@/lib/types";
import { teamsService } from "@/api/teamsService";

interface Props {
  team: Team;
  onClose: () => void;
  onUpdated: () => void;
}

const TeamDetailModal: React.FC<Props> = ({ team, onClose, onUpdated }) => {
  const [newMemberName, setNewMemberName] = useState("");

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    try {
      await teamsService.updateTeamMember(team.id, { name: newMemberName });
      setNewMemberName("");
      onUpdated();
    } catch (error) {
      console.error("멤버 추가 실패:", error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await teamsService.deleteTeamMember(team.id, [{ id: memberId }]);
      onUpdated();
    } catch (error) {
      console.error("멤버 삭제 실패:", error);
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
                    onClick={() => handleDeleteMember(member.id)}
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
      </DialogContent>
    </Dialog>
  );
};

export default TeamDetailModal;