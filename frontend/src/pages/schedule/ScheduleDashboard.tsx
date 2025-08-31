import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    Link,
    Save,
    ExternalLink,
    Settings,
    CalendarDays,
    Sparkles,
    Clock,
    Target,
} from "lucide-react";
import { scheduleService } from "@/api/schedule";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useIsMobile } from "@/hooks/use-mobile";
import PersonalCalendar from "@/components/schedule/PersonalCalendar";
import CalendarManagement from "@/components/schedule/CalendarManagement";
import useCalendarManagement from "@/hooks/useCalendarManagement";
import { cn } from "@/lib/utils";

/**
 * 개인 캘린더 관리 대시보드
 * - iCalendar URL 등록/수정
 * - 캘린더 동기화 관리
 * - 개인 가용시간 설정
 */
const ScheduleDashboard: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const [icalUrl, setIcalUrl] = useState("");

    // 캘린더 관리 훅
    const {
        calendars,
        addCalendar,
        updateCalendar,
        deleteCalendar,
        syncCalendar,
        syncAllCalendars,
        isLoading: isCalendarLoading,
    } = useCalendarManagement();

    // 캘린더 URL 저장 Mutation
    const saveCalendarMutation = useMutation({
        mutationFn: (url: string) =>
            scheduleService.saveUserCalendar({ icalUrl: url }),
        onSuccess: () => {
            toast({
                title: "캘린더 연동 완료! 🎉",
                description: "iCalendar가 성공적으로 연동되었습니다.",
            });
            setIcalUrl("");
            queryClient.invalidateQueries({
                queryKey: ["schedule", "user-calendar"],
            });
        },
        onError: (error: any) => {
            toast({
                title: "연동 실패",
                description:
                    error?.response?.data?.message ||
                    "캘린더 연동 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    // 로그인하지 않은 경우 로그인 페이지로 리디렉션
    if (!isAuthenticated) {
        navigate("/login");
        return null;
    }

    const handleSaveCalendar = async () => {
        if (!icalUrl.trim()) {
            toast({
                title: "입력 오류",
                description: "iCalendar URL을 입력해주세요.",
                variant: "destructive",
            });
            return;
        }

        if (!icalUrl.includes("http")) {
            toast({
                title: "올바른 URL을 입력해주세요",
                description:
                    "http:// 또는 https://로 시작하는 URL을 입력해주세요.",
                variant: "destructive",
            });
            return;
        }

        saveCalendarMutation.mutate(icalUrl);
    };

    const handleViewAllEvents = () => {
        navigate("/schedule");
    };

    return (
        <div
            className={cn(
                "container mx-auto space-y-4 sm:space-y-6",
                isMobile ? "p-4" : "p-6"
            )}
        >
            {/* 헤더 */}
            <div
                className={cn(
                    "flex flex-col gap-4",
                    !isMobile && "flex-row items-center justify-between"
                )}
            >
                <div className="space-y-1">
                    <h1
                        className={cn(
                            "font-bold text-foreground",
                            isMobile ? "text-2xl" : "text-3xl"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <Sparkles
                                className={cn(
                                    "text-primary",
                                    isMobile ? "w-6 h-6" : "w-8 h-8"
                                )}
                            />
                            개인 캘린더
                        </span>
                    </h1>
                    <p
                        className={cn(
                            "text-muted-foreground",
                            isMobile ? "text-sm" : "text-base"
                        )}
                    >
                        {isMobile
                            ? "외부 캘린더 연동 및 가용시간 관리"
                            : "외부 캘린더를 연동하고 가용시간을 관리하세요"}
                    </p>
                </div>

                {/* <Button 
          onClick={handleViewAllEvents} 
          variant="outline" 
          className={cn(
            "flex items-center gap-2",
            isMobile && "w-full justify-center"
          )}
        >
          <Calendar className="w-4 h-4" />
          {isMobile ? "일정 보기" : "전체 일정 보기"}
        </Button> */}
            </div>

            {/* 탭 메뉴 */}
            <Tabs defaultValue="calendar" className="w-full">
                <TabsList
                    className={cn(
                        "grid w-full grid-cols-2",
                        isMobile && "h-auto"
                    )}
                >
                    <TabsTrigger
                        value="calendar"
                        className={cn(
                            "flex items-center gap-2",
                            isMobile ? "flex-col py-3 px-2" : "flex-row"
                        )}
                    >
                        <CalendarDays className="w-4 h-4" />
                        <span className={isMobile ? "text-xs" : "text-sm"}>
                            {isMobile ? "캘린더" : "내 캘린더"}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="management"
                        className={cn(
                            "flex items-center gap-2",
                            isMobile ? "flex-col py-3 px-2" : "flex-row"
                        )}
                    >
                        <Settings className="w-4 h-4" />
                        <span className={isMobile ? "text-xs" : "text-sm"}>
                            {isMobile ? "관리" : "캘린더 관리"}
                        </span>
                    </TabsTrigger>
                </TabsList>

                {/* 캘린더 탭 */}
                <TabsContent
                    value="calendar"
                    className={cn("space-y-4", !isMobile && "space-y-6")}
                >
                    <div
                        className={cn(
                            "grid gap-4",
                            isMobile
                                ? "grid-cols-1"
                                : "grid-cols-1 lg:grid-cols-3 gap-6"
                        )}
                    >
                        {/* 개인 캘린더 - 메인 영역 */}
                        <div
                            className={cn(
                                isMobile ? "order-2" : "lg:col-span-2"
                            )}
                        >
                            <PersonalCalendar
                                allowBlocking={true}
                                showBlockedDates={true}
                                onDateSelect={(date) => {
                                    // Date selected handler
                                }}
                                className="w-full"
                            />
                        </div>

                        {/* 사이드바 - 안내 및 통계 */}
                        <div className={cn("space-y-4", isMobile && "order-1")}>
                            {/* 기능 소개 카드 - 반응형 */}
                            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                                <CardHeader
                                    className={isMobile ? "pb-3" : "pb-4"}
                                >
                                    <CardTitle
                                        className={cn(
                                            "flex items-center gap-2",
                                            isMobile ? "text-base" : "text-lg"
                                        )}
                                    >
                                        <Target className="w-5 h-5 text-primary" />
                                        핵심 기능
                                    </CardTitle>
                                </CardHeader>
                                <CardContent
                                    className={cn(
                                        "grid gap-3",
                                        isMobile ? "grid-cols-1" : "grid-cols-1"
                                    )}
                                >
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                                        <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                        <div className="space-y-1">
                                            <h4
                                                className={cn(
                                                    "font-semibold text-foreground",
                                                    isMobile
                                                        ? "text-xs"
                                                        : "text-sm"
                                                )}
                                            >
                                                자동 가용시간 계산
                                            </h4>
                                            <p
                                                className={cn(
                                                    "text-muted-foreground leading-relaxed",
                                                    isMobile
                                                        ? "text-xs"
                                                        : "text-xs"
                                                )}
                                            >
                                                기존 일정과 겹치지 않는 최적
                                                시간을 자동으로 찾아드립니다.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                                        <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <div className="space-y-1">
                                            <h4
                                                className={cn(
                                                    "font-semibold text-foreground",
                                                    isMobile
                                                        ? "text-xs"
                                                        : "text-sm"
                                                )}
                                            >
                                                시각적 일정 관리
                                            </h4>
                                            <p
                                                className={cn(
                                                    "text-muted-foreground leading-relaxed",
                                                    isMobile
                                                        ? "text-xs"
                                                        : "text-xs"
                                                )}
                                            >
                                                캘린더 뷰로 한눈에 일정을
                                                확인하고 관리할 수 있습니다.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 간단한 사용법 가이드 */}
                            <Card>
                                <CardHeader
                                    className={isMobile ? "pb-3" : "pb-4"}
                                >
                                    <CardTitle
                                        className={cn(
                                            "flex items-center gap-2",
                                            isMobile ? "text-base" : "text-lg"
                                        )}
                                    >
                                        ⚡ 빠른 시작
                                    </CardTitle>
                                </CardHeader>
                                <CardContent
                                    className={cn(
                                        "space-y-3",
                                        isMobile ? "text-xs" : "text-sm"
                                    )}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary font-bold mt-0.5">
                                            1.
                                        </span>
                                        <div className="space-y-1">
                                            <strong>캘린더 관리</strong>에서
                                            외부 캘린더를 연동하세요.
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary font-bold mt-0.5">
                                            2.
                                        </span>
                                        <div className="space-y-1">
                                            캘린더에서{" "}
                                            <strong>비활성화할 날짜</strong>를
                                            클릭하거나 드래그하세요.
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary font-bold mt-0.5">
                                            3.
                                        </span>
                                        <div className="space-y-1">
                                            자동으로 <strong>최적 시간</strong>
                                            이 계산되어 추천됩니다.
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* 캘린더 관리 탭 */}
                <TabsContent value="management" className="w-full">
                    <CalendarManagement
                        calendars={calendars}
                        onAddCalendar={addCalendar}
                        onUpdateCalendar={updateCalendar}
                        onDeleteCalendar={deleteCalendar}
                        onSyncCalendar={syncCalendar}
                        onSyncAllCalendars={syncAllCalendars}
                        isLoading={isCalendarLoading}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ScheduleDashboard;
