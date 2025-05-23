import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authService } from '@/api/auth';
import { Guild } from "@/lib/types";
import { Server } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string, name: string) => void;
}

const GuildSelectModal: React.FC<Props> = ({ open, onOpenChange, onSelect }) => {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleFetch = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const data = await authService.getUserGuilds();
      setGuilds(data);
    } catch (error) {
      console.error("길드 목록 가져오기 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    const selectedGuild = guilds.find(g => g.id === selectedId);
    if (selectedGuild) {
      onSelect(selectedGuild.id, selectedGuild.name);
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (open) {
      handleFetch();
    } else {
      setGuilds([]);
      setSelectedId(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl pointer-events-auto">
        <DialogHeader>
          <DialogTitle>길드 선택</DialogTitle>
        </DialogHeader>

        {/* 조회 버튼 */}
        <div className="flex justify-end mb-4">
          <Button onClick={handleFetch} size="sm" variant="outline">조회</Button>
        </div>

        {/* 길드 리스트 */}
        <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            [...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className="h-32 w-full rounded-lg" />
            ))
          ) : guilds.length > 0 ? (
            guilds.map((guild) => (
              <Card
                key={guild.id}
                className={`cursor-pointer transition ${
                  selectedId === guild.id ? "border-2 border-primary" : "hover:shadow-md"
                }`}
                onClick={() => setSelectedId(guild.id)}
              >
                <CardHeader className="flex flex-col items-center justify-center py-6">
                  {guild.icon ? (
                    <img
                      src={guild.icon}
                      alt={guild.name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Server className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <CardTitle className="text-center text-sm mt-2 truncate w-full">
                    {guild.name}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))
          ) : (
            <p className="col-span-2 text-center text-muted-foreground py-10">
              조회된 길드가 없습니다.
            </p>
          )}
        </div>

        {/* 선택 완료 버튼 */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={handleConfirm}
            disabled={!selectedId}
          >
            선택 완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuildSelectModal;