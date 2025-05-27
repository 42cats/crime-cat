import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Trash2,
    Crown,
    ArrowUpCircle,
    ArrowDownCircle,
    User,
} from "lucide-react";
import { TeamMember } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TeamMemberListProps {
    members: TeamMember[];
    currentUserId?: string;
    isCurrentUserLeader: boolean;
    onDeleteMember: (memberId: string) => void;
    onToggleLeader: (member: TeamMember) => void;
}

const TeamMemberList: React.FC<TeamMemberListProps> = ({
    members,
    currentUserId,
    isCurrentUserLeader,
    onDeleteMember,
    onToggleLeader,
}) => {
    // 리더를 리스트 상단에 표시하기 위한 정렬
    const sortedMembers = [...members].sort((a, b) => {
        if (a.leader && !b.leader) return -1;
        if (!a.leader && b.leader) return 1;
        return 0;
    });

    const listVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, x: -10, transition: { duration: 0.2 } },
    };

    return (
        <div className="overflow-y-auto max-h-[400px] pr-1">
            {members.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 gap-3"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence>
                        {sortedMembers.map((member) => {
                            const isCurrentUser =
                                member.userId === currentUserId;
                            const canDelete =
                                isCurrentUserLeader || isCurrentUser;

                            return (
                                <motion.div
                                    key={member.id}
                                    variants={itemVariants}
                                    exit="exit"
                                    layout
                                >
                                    <Card className="flex items-center justify-between p-4 border group hover:bg-accent/5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                {member.avatarUrl ? (
                                                    <AvatarImage
                                                        src={
                                                            member.avatarUrl ||
                                                            "/content/image/default_profile_image.png"
                                                        }
                                                        alt={member.name}
                                                    />
                                                ) : (
                                                    <AvatarFallback>
                                                        <User className="h-4 w-4" />
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>

                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {member.name}
                                                    </span>
                                                    {member.leader && (
                                                        <Crown className="h-4 w-4 text-amber-500" />
                                                    )}
                                                </div>
                                                {isCurrentUser && (
                                                    <span className="text-xs text-muted-foreground">
                                                        나
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {isCurrentUserLeader &&
                                                !isCurrentUser && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() =>
                                                            onToggleLeader(
                                                                member
                                                            )
                                                        }
                                                        aria-label={
                                                            member.leader
                                                                ? "리더 권한 해제"
                                                                : "리더로 지정"
                                                        }
                                                    >
                                                        {member.leader ? (
                                                            <ArrowDownCircle className="h-4 w-4 text-red-500" />
                                                        ) : (
                                                            <ArrowUpCircle className="h-4 w-4 text-blue-500" />
                                                        )}
                                                    </Button>
                                                )}

                                            {canDelete && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() =>
                                                        onDeleteMember(
                                                            member.id
                                                        )
                                                    }
                                                    aria-label="멤버 삭제"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    팀에 등록된 멤버가 없습니다. 멤버를 추가해보세요.
                </div>
            )}
        </div>
    );
};

export default TeamMemberList;
