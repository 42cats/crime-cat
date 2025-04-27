import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardProfileCard } from "@/pages/dashboard/DashbordProfileCard"; // ✅ 수정된 통합 카드
import { dailycheckService } from "@/api/dailycheckService";
import { userInfocheckService } from "@/api/userInfoService";
import { useToast } from "@/hooks/useToast";
import { userGrantedPermissionService } from "@/api/userGrantedPermissionService";
import { UserPermissionCard } from "@/components/UserPermissionCard";
const fetchDailyCheck = async (id: string) => {
    const data = await dailycheckService.getDailyCheck(id);
    return data;
};

const Dashboard: React.FC = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 로그인 상태 확인 후 리다이렉트
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate("/login");
        }
    }, [isLoading, isAuthenticated, navigate]);

    // 출석 정보 조회
    const {
        data: dailycheck,
        isLoading: isDailyCheckLoading,
        isError: isDailyCheckError,
    } = useQuery({
        queryKey: ["attendance", user?.id],
        queryFn: () => fetchDailyCheck(user!.id),
        enabled: !!user?.id,
    });

    // 추가 유저 데이터 조회
    const { data: additionalData } = useQuery({
        queryKey: ["additionalInfo", user?.id],
        queryFn: () => userInfocheckService.userInfoCheck(user!.id),
        enabled: !!user?.id,
    });

    const { data: permissionData } = useQuery({
        queryKey: ["userPermissions", user?.id],
        queryFn: () =>
            userGrantedPermissionService.fetchPermissions(user!.snowflake),
        enabled: !!user?.id,
    });

    // 출석 체크 Mutation
    const checkMutation = useMutation({
        mutationFn: () => dailycheckService.requestDailyCheck(user!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["attendance", user!.id],
            });
            toast({
                title: "출석 완료 🎉",
                description: "오늘도 출석 체크 성공!",
                duration: 3000,
            });
        },
        onError: () => {
            toast({
                title: "출석 실패 😢",
                description:
                    "출석 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.",
                variant: "destructive",
            });
        },
    });

    if (!user) return null;

    return (
        <div className="w-full flex justify-center items-center min-h-screen px-4">
            <div className="flex flex-wrap justify-center gap-6">
                {/* ✅ 데이터가 준비됐을 때만 카드 렌더링 */}
                {dailycheck && additionalData && (
                    <DashboardProfileCard
                        user={user}
                        dailyCheck={dailycheck}
                        onCheckDaily={() => checkMutation.mutate()}
                        isChecking={checkMutation.status === "pending"}
                        additionalInfo={{
                            themePlayCount: additionalData.themePlayCount,
                            recentlyPlayCrimeSeenTheme:
                                additionalData.recentlyPlayCrimeSeenTheme,
                            recentlyPlayCrimeSeenThemeTime:
                                additionalData.recentlyPlayCrimeSeenThemeTime,
                            mostFavoriteCrimeSeenMaker:
                                additionalData.mostFavoriteCrimeSeenMaker,
                        }}
                    />
                )}
                {/* ✅ 추가: 유저 권한 카드 */}
                {permissionData && (
                    <UserPermissionCard
                        permissions={permissionData.permissions}
                    />
                )}
                {/* ✅ 로딩 중일 때는 텍스트 표시 (선택사항) */}
                {(isDailyCheckLoading || !additionalData) && (
                    <div className="text-sm text-muted-foreground">
                        데이터를 불러오는 중입니다...
                    </div>
                )}

                {/* ✅ 에러 발생시 텍스트 표시 (선택사항) */}
                {isDailyCheckError && (
                    <div className="text-red-500 text-sm">
                        출석 정보를 불러오지 못했습니다.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
