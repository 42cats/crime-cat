import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { teamsService } from "@/api/teamsService";
import { useAuth } from "@/hooks/useAuth";
import { Team } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string) => void;
}

const TeamSelectModal: React.FC<Props> = ({ open, onOpenChange, onSelect }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"personal" | "team">("team");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleFetch = async () => {
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
    if (!user?.id) return;
    const idToSelect = mode === "personal" ? user.id : selectedId;
    if (idToSelect) {
      onSelect(idToSelect);
      onOpenChange(false);
    }
  };

  const handleCreateTeam = () => {
    window.open("/dashboard/teams", "_blank");
  };

  useEffect(() => {
    if (!open) {
      setTeams([]);
      setSelectedId(null);
      setMode("team"); // 기본 팀 모드
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl pointer-events-auto">
        <DialogHeader>
          <DialogTitle>개인 또는 팀 선택</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 모드 선택 */}
          <RadioGroup
            value={mode}
            onValueChange={(val) => {
              setMode(val as "personal" | "team");
              setSelectedId(null);
            }}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="personal" id="personal" />
              <Label htmlFor="personal" className="cursor-pointer">개인</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="team" id="team" />
              <Label htmlFor="team" className="cursor-pointer">팀</Label>
            </div>
          </RadioGroup>

          {/* 조회 / 팀 생성 */}
          {mode === "team" && (
            <div className="flex gap-2">
              <Button onClick={handleFetch}>조회</Button>
              <Button variant="secondary" onClick={handleCreateTeam}>팀 생성</Button>
            </div>
          )}

          {/* 목록 */}
          <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
            {mode === "team" ? (
              isLoading ? (
                [...Array(4)].map((_, idx) => (
                  <Skeleton key={idx} className="h-32 w-full rounded-lg" />
                ))
              ) : teams.length > 0 ? (
                teams.map((team) => (
                  <Card
                    key={team.id}
                    className={`cursor-pointer transition ${
                      selectedId === team.id ? "border-primary ring-2 ring-primary" : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedId(team.id)}
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
              )
            ) : (
              <div className="col-span-2 py-10 text-center text-muted-foreground">
                본인 계정으로 선택할 수 있습니다.
              </div>
            )}
          </div>

          {/* 선택 완료 */}
          <div className="flex justify-end">
            <Button
              onClick={handleConfirm}
              disabled={mode === "team" && !selectedId}
            >
              선택 완료
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSelectModal;