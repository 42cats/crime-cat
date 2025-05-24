import React, { useState, useEffect } from "react";
import {
    Star,
    MessageCircle,
    Trophy,
    Lock,
    Globe,
    Calendar,
    ExternalLink,
    ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EscapeRoomThemeDetailType } from "@/lib/types";
import ThemeHeader from "./ThemeHeader";
import ThemeInfo from "./ThemeInfo";
import CommentTabs from "./CommentTabs";
import GameHistorySection from "./GameHistorySection";
import { escapeRoomHistoryService } from "@/api/game/escapeRoomHistoryService";
import { useToast } from "@/hooks/useToast";

interface EscapeRoomDetailPageProps {
    theme: EscapeRoomThemeDetailType;
    onAddGameHistory?: () => void;
    onEditGameHistory?: (historyId: string) => void;
}

const EscapeRoomDetailPage: React.FC<EscapeRoomDetailPageProps> = ({
    theme,
    onAddGameHistory,
    onEditGameHistory,
}) => {
    const [activeTab, setActiveTab] = useState<"info" | "comments" | "history">(
        "info"
    );
    const [hasGameHistory, setHasGameHistory] = useState(false);
    const [checkingHistory, setCheckingHistory] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        checkUserGameHistory();
    }, [theme.id]);

    const checkUserGameHistory = async () => {
        try {
            setCheckingHistory(true);
            const hasPlayed = await escapeRoomHistoryService.hasPlayedTheme(
                theme.id
            );
            setHasGameHistory(hasPlayed);
        } catch (error) {
            console.error("게임 기록 확인 실패:", error);
        } finally {
            setCheckingHistory(false);
        }
    };



    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* 뒤로가기 버튼 */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/themes/escape-room')}
                className="flex items-center gap-2 mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                테마 목록으로 돌아가기
            </Button>

            {/* 테마 헤더 */}
            <ThemeHeader
                theme={theme}
                hasGameHistory={hasGameHistory}
                onAddGameHistory={onAddGameHistory}
            />

            {/* 메인 콘텐츠 - 세로 레이아웃으로 변경 */}
            <div className="space-y-6">
                {/* 메인 콘텐츠 탭 */}
                <div className="space-y-6">
                    <Tabs
                        value={activeTab}
                        onValueChange={(value) => setActiveTab(value as any)}
                    >
                        <TabsList className="w-full">
                            <TabsTrigger
                                value="info"
                                className="flex items-center gap-2"
                            >
                                <Star className="w-4 h-4" />
                                테마 정보
                            </TabsTrigger>
                            <TabsTrigger
                                value="comments"
                                className="flex items-center gap-2"
                                disabled={!theme.commentEnabled}
                            >
                                <MessageCircle className="w-4 h-4" />
                                댓글
                                {!theme.commentEnabled && (
                                    <Lock className="w-3 h-3" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="flex items-center gap-2"
                                disabled={!theme.allowGameHistory}
                            >
                                <Trophy className="w-4 h-4" />
                                플레이 기록
                                {!theme.allowGameHistory && (
                                    <Lock className="w-3 h-3" />
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4">
                            <ThemeInfo theme={theme} />
                        </TabsContent>

                        <TabsContent value="comments">
                            <CommentTabs
                                themeId={theme.id}
                                hasGameHistory={hasGameHistory}
                                allowComments={theme.commentEnabled}
                            />
                        </TabsContent>

                        <TabsContent value="history">
                            <GameHistorySection
                                themeId={theme.id}
                                hasGameHistory={hasGameHistory}
                                allowGameHistory={theme.allowGameHistory}
                                onAddGameHistory={onAddGameHistory}
                                onEditGameHistory={onEditGameHistory}
                            />
                        </TabsContent>
                    </Tabs>
                    
                    {/* URL 바로가기 정보 */}
                    {(theme.homepageUrl || theme.reservationUrl) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <ExternalLink className="w-5 h-5" />
                                        바로가기
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {theme.homepageUrl && (
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() =>
                                                window.open(
                                                    theme.homepageUrl,
                                                    "_blank",
                                                    "noopener,noreferrer"
                                                )
                                            }
                                        >
                                            <Globe className="w-4 h-4 mr-2" />
                                            홈페이지 방문
                                            <ExternalLink className="w-3 h-3 ml-auto" />
                                        </Button>
                                    )}
                                    {theme.reservationUrl && (
                                        <Button
                                            className="w-full justify-start bg-green-600 hover:bg-green-700"
                                            onClick={() =>
                                                window.open(
                                                    theme.reservationUrl,
                                                    "_blank",
                                                    "noopener,noreferrer"
                                                )
                                            }
                                        >
                                            <Calendar className="w-4 h-4 mr-2" />
                                            예약하기
                                            <ExternalLink className="w-3 h-3 ml-auto" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                    )}

                    {/* 플레이 기록 버튼 - 고정 위치에서 제거하고 플로팅 버튼으로 */}
                    {theme.allowGameHistory && onAddGameHistory && (
                        <div className="fixed bottom-6 right-6 z-50 md:hidden">
                            <Button
                                onClick={onAddGameHistory}
                                className="rounded-full shadow-lg"
                                size="lg"
                            >
                                <Trophy className="w-5 h-5" />
                            </Button>
                        </div>
                    )}

                    {/* 데스크톱에서는 상단에 버튼 표시 */}
                    {theme.allowGameHistory && onAddGameHistory && (
                        <div className="hidden md:flex justify-end">
                            <Button onClick={onAddGameHistory} size="lg">
                                <Trophy className="w-4 h-4 mr-2" />
                                플레이 기록 추가
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EscapeRoomDetailPage;
