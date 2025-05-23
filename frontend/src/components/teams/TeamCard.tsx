import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Users } from "lucide-react";
import { Team } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface TeamCardProps {
  team: Team;
  onSelect: (team: Team) => void;
  onDelete: (teamId: string) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onSelect, onDelete }) => {
  // 애니메이션 변수
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="h-full cursor-pointer overflow-hidden border-2 hover:border-primary/50 transition-all"
        onClick={() => onSelect(team)}
      >
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle className="text-xl font-bold truncate">{team.name}</CardTitle>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(team.id);
            }}
            aria-label={`${team.name} 팀 삭제`}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {team.count || 0}명의 멤버
            </span>
          </div>
          
          {team.members && team.members.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {team.members.slice(0, 3).map((member) => (
                <Badge 
                  key={member.id} 
                  variant={member.leader ? "default" : "outline"}
                  className="truncate max-w-[120px]"
                >
                  {member.leader && "👑 "}
                  {member.name}
                </Badge>
              ))}
              {team.members.length > 3 && (
                <Badge variant="secondary" className="truncate">
                  +{team.members.length - 3}명
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeamCard;