import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Team } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
    TeamCard,
    TeamDetailModal,
    TeamCreationForm,
    ConfirmationDialog,
    useTeams,
} from "@/components/teams";
import { useToast } from "@/hooks/useToast";

const DashboardTeams: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { teams, isLoading, fetchTeams, createTeam, deleteTeam } = useTeams();

    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteTeamTarget, setDeleteTeamTarget] = useState<string | null>(
        null
    );
    const [deletingTeamName, setDeletingTeamName] = useState<string>("");

    useEffect(() => {
        if (user?.id) {
            console.log("팀 목록 조회 시작, userId:", user.id);
            fetchTeams();
        }
    }, [user?.id]); // fetchTeams는 제외 (무한 루프 방지)

    const handleCreateTeam = async (teamName: string) => {
        await createTeam(teamName);
    };

    const handleDeleteTeamConfirm = async () => {
        if (!deleteTeamTarget) return;
        await deleteTeam(deleteTeamTarget);
    };

    const handleDeleteTeamRequest = (teamId: string, teamName: string) => {
        setDeleteTeamTarget(teamId);
        setDeletingTeamName(teamName);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    return (
        <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
            {/* 헤더 영역 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        합작 팀 관리
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        합작팀을 생성하고 관리하여 함께 제작 활동 해 보세요.
                    </p>
                </div>
                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />새 팀 만들기
                </Button>
            </div>

            {/* 팀 목록 */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, idx) => (
                        <div key={idx} className="space-y-3">
                            <Skeleton className="h-48 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : teams.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence>
                        {teams.map((team) => (
                            <TeamCard
                                key={team.id}
                                team={team}
                                onSelect={setSelectedTeam}
                                onDelete={(teamId) =>
                                    handleDeleteTeamRequest(teamId, team.name)
                                }
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="text-center py-24 border border-dashed rounded-lg bg-muted/30">
                    <h3 className="text-xl font-medium mb-2">
                        아직 합작팀이 없습니다
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        새로운 합작팀을 생성하고 멤버들과 함께 활동해보세요.
                    </p>
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />새 합작팀 만들기
                    </Button>
                </div>
            )}

            {/* 팀 생성 다이얼로그 */}
            <TeamCreationForm
                isOpen={isCreateDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={handleCreateTeam}
            />

            {/* 팀 상세 다이얼로그 */}
            {selectedTeam && (
                <TeamDetailModal
                    team={selectedTeam}
                    onClose={() => setSelectedTeam(null)}
                    onUpdated={fetchTeams}
                />
            )}

            {/* 팀 삭제 확인 다이얼로그 */}
            <ConfirmationDialog
                isOpen={Boolean(deleteTeamTarget)}
                onClose={() => setDeleteTeamTarget(null)}
                onConfirm={handleDeleteTeamConfirm}
                title="팀 삭제"
                description={`"${deletingTeamName}" 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 팀원 정보가 삭제됩니다.`}
                confirmText="삭제"
                variant="destructive"
            />
        </div>
    );
};

export default DashboardTeams;
