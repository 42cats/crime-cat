import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string) => void;
}

const TeamSelectModal: React.FC<Props> = ({ open, onOpenChange, onSelect }) => {
  const dummyTeams = ["team-a", "team-b", "team-c"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>팀 선택</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {dummyTeams.map((team) => (
            <Button key={team} variant="outline" className="w-full" onClick={() => { onSelect(team); onOpenChange(false); }}>
              {team}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSelectModal;