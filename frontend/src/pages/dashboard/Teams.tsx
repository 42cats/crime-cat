import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { teamsService } from "@/api/teamsService";
import { Team } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import TeamDetailModal from "@/components/dashboard/TeamDetailModal"; // ✅ 추가!

const DashboardTeams: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null); // ✅ 현재 선택된 팀

  const fetchTeams = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await teamsService.getTeams(user.id);
      setTeams(data.map(team => ({ ...team, members: team.members || [] })));
    } catch (error) {
      console.error("팀 목록 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      await teamsService.createTeam({ name: newTeamName });
      setNewTeamName("");
      setCreateDialogOpen(false);
      fetchTeams();
    } catch (error) {
      console.error("팀 생성 실패:", error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await teamsService.deleteTeam(teamId);
      fetchTeams();
    } catch (error) {
      console.error("팀 삭제 실패:", error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">팀 관리</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> 새 팀 만들기
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, idx) => (
            <Skeleton key={idx} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : teams.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => (
            <Card key={team.id} 
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedTeam(team)}
            >
              <CardHeader className="flex justify-between items-center">
                <CardTitle>{team.name}</CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation(); // 카드 클릭 방지
                    handleDeleteTeam(team.id);
                  }}
                >
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10">팀이 없습니다. 새로 생성해보세요!</p>
      )}

      {/* 팀 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 팀 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="팀 이름 입력"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
            <Button className="w-full" onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
              생성하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 팀 상세 다이얼로그 */}
      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onUpdated={fetchTeams} // ✅ 수정 후 새로고침
        />
      )}
    </div>
  );
};

export default DashboardTeams;