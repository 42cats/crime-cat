import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { teamsService } from "@/api/teamsService";
import { Crown } from "lucide-react";

interface TeamInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

const TeamInfoModal: React.FC<TeamInfoModalProps> = ({ open, onOpenChange, teamId }) => {
  const { data: team, isLoading } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => teamsService.getTeamById(teamId),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>팀 정보</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-muted-foreground">불러오는 중...</p>
        ) : team ? (
          <div className="space-y-4">
            <p className="font-semibold mb-2">팀 이름</p>
              {team.name}
            <div>
              <p className="font-semibold mb-2">팀원 목록</p>
              {team.members.length > 0 ? (
                <ul className="space-y-1">
                  {team.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      {member.leader && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                      {member.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">팀원이 없습니다.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-destructive">팀 정보를 불러올 수 없습니다.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamInfoModal;