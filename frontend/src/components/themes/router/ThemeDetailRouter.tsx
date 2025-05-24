import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import CrimesceneThemeDetail from '../crimescene/CrimesceneThemeDetail';
import EscapeRoomDetailPage from '@/components/escape-room/detail/EscapeRoomDetailPage';
import GameHistoryModal from '@/components/escape-room/detail/GameHistoryModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { themesService } from '@/api/content';
import { escapeRoomHistoryService, EscapeRoomHistoryResponse } from '@/api/game/escapeRoomHistoryService';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { EscapeRoomThemeDetailType } from '@/lib/types';

const ThemeDetailRouter: React.FC = () => {
    const { category, id } = useParams<{ category: string; id: string }>();
    const queryClient = useQueryClient();
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [editingHistoryId, setEditingHistoryId] = useState<string | undefined>();
    const [editingHistoryData, setEditingHistoryData] = useState<EscapeRoomHistoryResponse | undefined>();
    
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
            
            // EscapeRoomThemeDetailType 형식으로 데이터 전달
            const escapeRoomTheme = escapeRoomData;
            
            console.log('변환된 방탈출 테마 데이터:', escapeRoomTheme);
            
            // 기록 추가 핸들러
            const handleAddGameHistory = () => {
                console.log('플레이 기록 추가 클릭');
                setEditingHistoryId(undefined);
                setEditingHistoryData(undefined);
                setIsHistoryModalOpen(true);
            };
            
            // 기록 수정 핸들러
            const handleEditGameHistory = async (historyId: string) => {
                console.log('플레이 기록 수정 클릭:', historyId);
                try {
                    const historyData = await escapeRoomHistoryService.getHistory(historyId);
                    setEditingHistoryId(historyId);
                    setEditingHistoryData(historyData);
                    setIsHistoryModalOpen(true);
                } catch (error) {
                    console.error('기록 조회 실패:', error);
                }
            };
            
            // 모달 성공 핸들러
            const handleHistorySuccess = () => {
                // 방탈출 테마 데이터 재조회 (hasPlayedTheme 업데이트를 위해)
                queryClient.invalidateQueries({ queryKey: ['escape-room-theme', id] });
                // GameHistorySection의 목록도 재조회
                queryClient.invalidateQueries({ queryKey: ['escape-room-histories'] });
            };
            
            return (
                <>
                    <EscapeRoomDetailPage 
                        theme={escapeRoomTheme}
                        onAddGameHistory={handleAddGameHistory}
                        onEditGameHistory={handleEditGameHistory}
                    />
                    
                    {/* 기록 추가/수정 모달 */}
                    <GameHistoryModal
                        isOpen={isHistoryModalOpen}
                        onClose={() => {
                            setIsHistoryModalOpen(false);
                            setEditingHistoryId(undefined);
                            setEditingHistoryData(undefined);
                        }}
                        themeId={escapeRoomData.id}
                        historyId={editingHistoryId}
                        initialData={editingHistoryData}
                        onSuccess={handleHistorySuccess}
                    />
                </>
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