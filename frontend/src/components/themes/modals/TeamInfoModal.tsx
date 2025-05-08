import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { teamsService } from "@/api/teamsService";

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
          <p>불러오는 중...</p>
        ) : team ? (
          <div>
            <p><strong>팀 이름:</strong> {team.name}</p>
            {/* 필요시 멤버 목록 등 추가 */}
          </div>
        ) : (
          <p>팀 정보를 불러올 수 없습니다.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamInfoModal;