import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Trash2, Check, Plus, Search, Crown, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Team } from "@/lib/types";
import { teamsService } from '@/api/guild';
import { searchUserService } from '@/api/social/search';
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchUser, SearchUsers } from "@/lib/types";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  team: Team;
  onClose: () => void;
  onUpdated: () => void;
}

const TeamDetailModal: React.FC<Props> = ({ team, onClose, onUpdated }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [teamDetail, setTeamDetail] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [fetchedUsers, setFetchedUsers] = useState<SearchUser[]>([]);
  const [hasNext, setHasNext] = useState(false);

  const fetchTeam = async () => {
    const res = await teamsService.getTeamById(team.id);
    if (res) setTeamDetail(res);
  };

  useEffect(() => {
    fetchTeam();
  }, [team.id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(0);
      setFetchedUsers([]);
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const { data: searchResult, isFetching } = useQuery<SearchUsers>({
    queryKey: ["search-user", debouncedQuery, page],
    queryFn: () =>
      searchUserService.getSearchUser(
        `keyword=${debouncedQuery}&page=${page}&size=5`
      ),
    enabled: !!debouncedQuery.trim(),
  });

  useEffect(() => {
    if (searchResult) {
      setFetchedUsers((prev) =>
        page === 0 ? searchResult.content : [...prev, ...searchResult.content]
      );
      setHasNext(searchResult.hasNext);
    }
  }, [searchResult, page]);

  const handleAddMember = async (user: SearchUser) => {
    try {
      await teamsService.updateTeamMember(team.id, {
        members: [
          {
            userId: user.id,
            name: user.nickname,
          },
        ],
      });
      toast({
        title: "멤버 추가 완료",
        description: `${user.nickname} 님이 추가되었습니다.`,
      });
      await fetchTeam();
      onUpdated();
    } catch (error) {
      toast({
        title: "오류",
        description: "멤버 추가 실패",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const res = await teamsService.deleteTeamMember(team.id, { members: [memberId] });

      const failedIds = res?.failed ?? [];
      if (failedIds.length > 0) {
        const failedNames = teamDetail?.members
          .filter((m) => failedIds.includes(m.id))
          .map((m) => m.name)
          .join(", ");

        toast({
          title: "일부 멤버 삭제 실패",
          description: `${failedNames} 삭제에 실패했습니다.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "멤버 삭제 완료", description: "멤버가 삭제되었습니다." });
      }

      setDeleteTarget(null);
      await fetchTeam();
      onUpdated();
    } catch (error) {
      toast({
        title: "오류",
        description: "멤버 삭제 실패",
        variant: "destructive",
      });
    }};

  const handleToggleLeader = async (memberId: string, memberName: string, isCurrentlyLeader: boolean) => {
    try {
      await teamsService.modifyTeamMember(
        team.id,
        memberId,
        {
          name: memberName,
          leader: !isCurrentlyLeader,
        }
      );
      toast({
        title: !isCurrentlyLeader ? "리더 임명 완료" : "리더 해제 완료",
        description: `해당 멤버가 ${!isCurrentlyLeader ? "리더로 지정" : "리더 해제"}되었습니다.`,
      });
      await fetchTeam();
      onUpdated();
    } catch (error) {
      toast({
        title: "오류",
        description: "리더 권한 변경 실패",
        variant: "destructive",
      });
    }
  };

  const isUserInTeam = (userId: string) =>
    teamDetail?.members.some((member) => member.userId === userId);

  const isCurrentUserLeader = useMemo(() => {
    return teamDetail?.members.some((m) => m.userId === user?.id && m.leader);
  }, [teamDetail, user?.id]);

  const isSelf = (member: { userId?: string }) => member.userId === user?.id;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{team.name} - 팀 상세</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 유저 검색 */}
          <div className="relative space-y-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="닉네임으로 유저 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {fetchedUsers.length > 0 && (
              <div className="absolute z-20 w-full max-h-60 mt-1 bg-white border shadow-md rounded-md overflow-y-auto">
                {fetchedUsers.map((user) => {
                  const inTeam = isUserInTeam?.(user.id);
                  return (
                    <div
                      key={user.id}
                      className={clsx(
                        "flex justify-between items-center px-3 py-2 hover:bg-accent transition cursor-pointer"
                      )}
                    >
                      <span>{user.nickname}</span>
                      {inTeam ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleAddMember(user)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                {hasNext && (
                  <Button
                    onClick={() => setPage((prev) => prev + 1)}
                    className="w-full rounded-none"
                    variant="ghost"
                    disabled={isFetching}
                  >
                    더보기
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* 멤버 목록 */}
          <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto mt-6">
            {teamDetail?.members.length ? (
              teamDetail.members.map((member) => (
                <Card key={member.id} className="flex justify-between items-center p-4">
                  <div className="flex items-center gap-2">
                    {member.leader && <Crown className="w-4 h-4 text-yellow-500" />}
                    <CardTitle className="text-sm">{member.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrentUserLeader && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleLeader(member.id, member.name, member.leader)}
                      >
                        {member.leader ? (
                          <ArrowDownCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <ArrowUpCircle className="w-4 h-4 text-blue-500" />
                        )}
                      </Button>
                    )}
                    {(isSelf(member) || isCurrentUserLeader) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTarget(member.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground">
                팀에 등록된 멤버가 없습니다.
              </p>
            )}
          </div>

          {/* 닫기 */}
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
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 선택한 멤버가 팀에서 삭제됩니다.
                </AlertDialogDescription>
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
