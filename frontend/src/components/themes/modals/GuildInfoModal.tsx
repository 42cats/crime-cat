import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { guildsService } from "@/api/guildsService";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { UTCToKST } from "@/lib/dateFormat";

interface GuildInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guildSnowflake: string;
}

const GuildInfoModal: React.FC<GuildInfoModalProps> = ({
  open,
  onOpenChange,
  guildSnowflake,
}) => {
  const { data: guild, isLoading } = useQuery({
    queryKey: ["guild", guildSnowflake],
    queryFn: () => guildsService.getGuildDetail(guildSnowflake),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>길드 정보</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p>불러오는 중...</p>
        ) : guild ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarImage
                src={guild.guildIcon || "https://cdn.discordapp.com/embed/avatars/1.png"} 
                alt={guild.guildName} />
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{guild.guildName}</p>
                <p className="text-sm text-muted-foreground">
                  대표: {guild.guildOwnerName}
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>길드 생성일: <UTCToKST date={guild.guildCreatedAt} /></p>
              <p>마지막 플레이 일자:<UTCToKST date={guild.lastPlayTime} /></p>
            </div>

            <div className="text-sm mt-4">
              <p>전체 회원 수: {guild.guildMemberCount.toLocaleString()}명</p>
              <p>현재 온라인: {guild.guildOnlineMemeberCount.toLocaleString()}명</p>
              <p>누적 참여자 수: {guild.totalHistoryUserCount.toLocaleString()}명</p>
            </div>
          </div>
        ) : (
          <p>길드 정보를 불러올 수 없습니다.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GuildInfoModal;