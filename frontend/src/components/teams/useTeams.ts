import { useState } from "react";
import { Team } from "@/lib/types";
import { teamsService } from "@/api/guild";
import { useToast } from "@/hooks/useToast";

export const useTeams = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await teamsService.getMyTeams();
      setTeams(data.map(team => ({ ...team, members: team.members || [] })));
      return data;
    } catch (error) {
      console.error("팀 목록 조회 실패:", error);
      setError(error instanceof Error ? error : new Error("팀 목록을 불러오는데 실패했습니다."));
      toast({
        title: "팀 목록 로드 실패",
        description: "팀 목록을 불러오는데 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createTeam = async (name: string) => {
    try {
      await teamsService.createTeam({ name });
      toast({
        title: "팀 생성 완료",
        description: `${name} 팀이 생성되었습니다.`,
      });
      await fetchTeams();
    } catch (error) {
      console.error("팀 생성 실패:", error);
      toast({
        title: "팀 생성 실패",
        description: "팀 생성에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      await teamsService.deleteTeam(teamId);
      toast({
        title: "팀 삭제 완료",
        description: "팀이 삭제되었습니다.",
      });
      await fetchTeams();
    } catch (error) {
      console.error("팀 삭제 실패:", error);
      toast({
        title: "팀 삭제 실패",
        description: "팀 삭제에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    teams,
    isLoading,
    error,
    fetchTeams,
    createTeam,
    deleteTeam,
  };
};
