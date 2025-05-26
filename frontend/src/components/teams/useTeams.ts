import { useState, useCallback } from "react";
import { Team } from "@/lib/types";
import { teamsService } from "@/api/guild";
import { useToast } from "@/hooks/useToast";

export const useTeams = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("팀 목록 API 호출 시작");
      const data = await teamsService.getMyTeams();
      console.log("팀 목록 API 응답:", data);
      
      // 데이터가 배열인지 확인
      const teamsArray = Array.isArray(data) ? data : [];
      setTeams(teamsArray.map(team => ({ ...team, members: team.members || [] })));
      return teamsArray;
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
  }, [toast]);

  const createTeam = async (name: string) => {
    try {
      console.log("팀 생성 시도:", { name });
      const result = await teamsService.createTeam({ name });
      console.log("팀 생성 결과:", result);
      
      toast({
        title: "팀 생성 완료",
        description: `${name} 팀이 생성되었습니다.`,
      });
      
      // 팀 생성 후 짧은 디레이를 주고 목록 새로고침
      setTimeout(async () => {
        console.log("팀 목록 새로고침 시작");
        await fetchTeams();
      }, 500);
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
