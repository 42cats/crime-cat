import React from 'react';
import { useParams } from 'react-router-dom';
import CrimesceneThemeDetail from '../crimescene/CrimesceneThemeDetail';
import EscapeRoomDetailPage from '@/components/escape-room/detail/EscapeRoomDetailPage';
import { useQuery } from '@tanstack/react-query';
import { themesService } from '@/api/content';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

const ThemeDetailRouter: React.FC = () => {
    const { category, id } = useParams<{ category: string; id: string }>();
    
    // 방탈출 테마인 경우 별도 데이터 fetching
    const { data: escapeRoomData, isLoading: escapeRoomLoading, error: escapeRoomError } = useQuery({
        queryKey: ['escape-room-theme', id],
        queryFn: async () => {
            const data = await themesService.getEscapeRoomTheme(id!);
            console.log('방탈출 테마 원본 데이터:', data);
            return data;
        },
        enabled: category === 'escape-room' && !!id,
    });

    // 카테고리별 컴포넌트 렌더링
    switch (category) {
        case 'crimescene':
            return <CrimesceneThemeDetail />;
            
        case 'escape-room':
        case 'escape_room':
            if (escapeRoomLoading) {
                return (
                    <div className="container mx-auto py-8">
                        <Skeleton className="h-96 w-full" />
                    </div>
                );
            }
            
            if (escapeRoomError || !escapeRoomData) {
                return (
                    <div className="container mx-auto py-8">
                        <div className="flex flex-col items-center justify-center py-20">
                            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">테마를 불러올 수 없습니다</h2>
                            <p className="text-muted-foreground">잠시 후 다시 시도해주세요.</p>
                        </div>
                    </div>
                );
            }
            
            // EscapeRoomDetailPage가 기대하는 데이터 형식으로 변환
            const escapeRoomTheme = {
                id: escapeRoomData.id,
                title: escapeRoomData.title,
                description: escapeRoomData.content || escapeRoomData.summary,
                difficulty: escapeRoomData.difficulty,
                minParticipants: escapeRoomData.playersMin,
                maxParticipants: escapeRoomData.playersMax,
                estimatedDuration: escapeRoomData.playTimeMax,
                price: escapeRoomData.price,
                genreTags: escapeRoomData.genreTags || [],
                locations: escapeRoomData.locations || [],
                isActive: escapeRoomData.publicStatus,
                allowComments: escapeRoomData.commentEnabled,
                allowGameHistory: true,
                homepageUrl: escapeRoomData.homepageUrl,
                reservationUrl: escapeRoomData.reservationUrl,
                createdAt: escapeRoomData.createdAt || new Date().toISOString(),
                updatedAt: escapeRoomData.updatedAt || new Date().toISOString(),
                // 방탈출 전용 필드 추가
                thumbnail: escapeRoomData.thumbnail,
                horrorLevel: escapeRoomData.horrorLevel,
                deviceRatio: escapeRoomData.deviceRatio,
                activityLevel: escapeRoomData.activityLevel,
                openDate: escapeRoomData.openDate,
            };
            
            console.log('변환된 방탈출 테마 데이터:', escapeRoomTheme);
            
            return (
                <EscapeRoomDetailPage 
                    theme={escapeRoomTheme}
                    hasGameHistory={true}
                    onAddGameHistory={() => {
                        console.log('플레이 기록 추가 클릭');
                        // TODO: 플레이 기록 추가 모달 또는 페이지로 이동
                    }}
                />
            );
            
        case 'murder-mystery':
            // TODO: 머더미스터리 상세 페이지 구현
            return (
                <div className="container mx-auto py-8">
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">머더미스터리 테마</h2>
                        <p className="text-muted-foreground">준비 중입니다.</p>
                    </div>
                </div>
            );
            
        case 'realworld':
            // TODO: 리얼월드 상세 페이지 구현
            return (
                <div className="container mx-auto py-8">
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">리얼월드 테마</h2>
                        <p className="text-muted-foreground">준비 중입니다.</p>
                    </div>
                </div>
            );
            
        default:
            return (
                <div className="container mx-auto py-8">
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">잘못된 테마 타입</h2>
                        <p className="text-muted-foreground">유효하지 않은 테마 타입입니다.</p>
                    </div>
                </div>
            );
    }
};

export default ThemeDetailRouter;