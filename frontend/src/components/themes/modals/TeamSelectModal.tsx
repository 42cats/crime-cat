import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { teamsService } from '@/api/guild';
import { useAuth } from "@/hooks/useAuth";
import { Team } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string, name: string) => void;
}

const TeamSelectModal: React.FC<Props> = ({ open, onOpenChange, onSelect }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const fetchTeams = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await teamsService.getTeams(user.id);
      setTeams(data);
    } catch (error) {
      console.error("팀 목록 가져오기 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedTeam) {
      onSelect(selectedTeam.id, selectedTeam.name);
      onOpenChange(false);
    }
  };

  const handleCreateTeam = () => {
    window.open("/dashboard/teams", "_blank");
  };

  useEffect(() => {
    if (open) {
      fetchTeams();
    }
    if (!open) {
      setTeams([]);
      setSelectedTeam(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl pointer-events-auto">
        {/* 상단 제목 + 버튼 */}
        <div className="flex justify-between items-center">
          <DialogHeader>
            <DialogTitle>팀 선택</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTeams}>조회</Button>
            <Button variant="secondary" size="sm" onClick={handleCreateTeam}>팀 생성</Button>
          </div>
        </div>

        <div className="space-y-6 mt-4">
          {/* 팀 목록 */}
          <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              [...Array(4)].map((_, idx) => (
                <Skeleton key={idx} className="h-32 w-full rounded-lg" />
              ))
            ) : teams.length > 0 ? (
              teams.map((team) => (
                <Card
                  key={team.id}
                  className={`
                    cursor-pointer transition rounded-lg border-2
                    ${selectedTeam?.id === team.id
                      ? "border-primary shadow-md"
                      : "border-border hover:border-primary/50 hover:shadow-sm"
                    }
                  `}
                  onClick={() => setSelectedTeam(team)}
                >
                  <CardHeader className="flex flex-col items-center justify-center py-6">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-center text-sm mt-2 truncate w-full">
                      {team.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <p className="col-span-2 text-center text-muted-foreground py-10">
                조회된 팀이 없습니다.
              </p>
            )}
          </div>

          {/* 선택 완료 */}
          <div className="flex justify-end">
            <Button onClick={handleConfirm} disabled={!selectedTeam}>
              선택 완료
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSelectModal;