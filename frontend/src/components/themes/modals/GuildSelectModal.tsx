import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string) => void;
}

const GuildSelectModal: React.FC<Props> = ({ open, onOpenChange, onSelect }) => {
  const dummyGuilds = ["guild-x", "guild-y", "guild-z"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>길드 선택</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {dummyGuilds.map((guild) => (
            <Button key={guild} variant="outline" className="w-full" onClick={() => { onSelect(guild); onOpenChange(false); }}>
              {guild}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuildSelectModal;