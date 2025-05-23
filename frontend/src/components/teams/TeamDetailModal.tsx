import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Team, TeamMember, SearchUser } from "@/lib/types";
import { teamsService } from '@/api/guild';
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import UserSearch from "./UserSearch";
import TeamMemberList from "./TeamMemberList";
import ConfirmationDialog from "./ConfirmationDialog";
import { Users } from "lucide-react";

interface TeamDetailModalProps {
  team: Team;
  onClose: () => void;
  onUpdated: () => void;
}

const TeamDetailModal: React.FC<TeamDetailModalProps> = ({ 
  team, 
  onClose, 
  onUpdated 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [teamDetail, setTeamDetail] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchTeam = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await teamsService.getTeamById(team.id);
      if (res) setTeamDetail(res);
    } catch (error) {
      console.error("팀 정보 조회 실패:", error);
      setIsError(true);
      toast({
        title: "팀 정보 로드 실패",
        description: "팀 정보를 불러오는데 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [team.id]);

  const handleAddMember = async (searchUser: SearchUser) => {
    try {
      await teamsService.updateTeamMember(team.id, {
        members: [
          {
            userId: searchUser.id,
            name: searchUser.nickname,
          },
        ],
      });
      toast({
        title: "멤버 추가 완료",
        description: `${searchUser.nickname}님이 팀에 추가되었습니다.`,
      });
      await fetchTeam();
      onUpdated();
    } catch (error) {
      console.error("멤버 추가 실패:", error);
      toast({
        title: "멤버 추가 실패",
        description: "멤버 추가에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;
    
    try {
      const res = await teamsService.deleteTeamMember(team.id, { members: [deleteTarget] });

      const failedIds = res?.failed ?? [];
      if (failedIds.length > 0) {
        const failedNames = teamDetail?.members
          ?.filter((m) => failedIds.includes(m.id))
          .map((m) => m.name)
          .join(", ");

        toast({
          title: "멤버 삭제 실패",
          description: `${failedNames || "멤버"} 삭제에 실패했습니다.`,
          variant: "destructive",
        });
      } else {
        toast({ 
          title: "멤버 삭제 완료", 
          description: "멤버가 팀에서 제외되었습니다." 
        });
      }

      await fetchTeam();
      onUpdated();
    } catch (error) {
      console.error("멤버 삭제 실패:", error);
      toast({
        title: "멤버 삭제 실패",
        description: "멤버 삭제에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleToggleLeader = async (member: TeamMember) => {
    if (!member.id || !member.name) return;
    
    try {
      await teamsService.modifyTeamMember(
        team.id,
        member.id,
        {
          name: member.name,
          leader: !member.leader,
        }
      );
      toast({
        title: !member.leader ? "리더 지정 완료" : "리더 해제 완료",
        description: `${member.name}님이 ${!member.leader ? "리더로 지정" : "리더에서 해제"}되었습니다.`,
      });
      await fetchTeam();
      onUpdated();
    } catch (error) {
      console.error("리더 권한 변경 실패:", error);
      toast({
        title: "리더 권한 변경 실패",
        description: "리더 권한 변경에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const isCurrentUserLeader = Boolean(
    teamDetail?.members?.some((m) => m.userId === user?.id && m.leader)
  );

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <span>{team.name}</span>
              {isLoading ? null : (
                <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {teamDetail?.members?.length || 0}명
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {isLoading ? (
              <div className="py-20 flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">팀 정보 로드 중...</p>
                </div>
              </div>
            ) : isError ? (
              <div className="py-16 text-center">
                <p className="text-muted-foreground mb-4">팀 정보를 불러오는데 실패했습니다.</p>
                <Button onClick={fetchTeam}>다시 시도</Button>
              </div>
            ) : (
              <>
                {/* 유저 검색 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">팀원 추가</h3>
                  <UserSearch 
                    teamId={team.id} 
                    teamMembers={teamDetail?.members || []}
                    onAddMember={handleAddMember}
                  />
                  <p className="text-xs text-muted-foreground">
                    닉네임으로 유저를 검색하여 팀에 추가할 수 있습니다.
                  </p>
                </div>

                {/* 멤버 목록 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">팀원 목록</h3>
                  <TeamMemberList
                    members={teamDetail?.members || []}
                    currentUserId={user?.id}
                    isCurrentUserLeader={isCurrentUserLeader}
                    onDeleteMember={(memberId) => setDeleteTarget(memberId)}
                    onToggleLeader={handleToggleLeader}
                  />
                </div>
              </>
            )}

            {/* 버튼 영역 */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 멤버 삭제 확인 다이얼로그 */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteMember}
        title="팀원 삭제"
        description="정말 이 팀원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        variant="destructive"
      />
    </>
  );
};

export default TeamDetailModal;