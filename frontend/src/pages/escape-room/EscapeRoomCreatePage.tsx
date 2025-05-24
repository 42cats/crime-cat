import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EscapeRoomThemeForm from '@/components/escape-room/form/EscapeRoomThemeForm';
import { EscapeRoomLocation } from '@/lib/types';

interface EscapeRoomThemeFormData {
    title: string;
    description: string;
    locations: EscapeRoomLocation[];

    difficulty: number;
    minParticipants: number;
    maxParticipants: number;
    estimatedDuration: number;
    price: number;
    isActive: boolean;
    allowComments: boolean;
    allowGameHistory: boolean;
}

const EscapeRoomCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: EscapeRoomThemeFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            // 실제 API 호출로 대체될 부분
            console.log('Creating escape room theme:', data);
            
            // API 호출 시뮬레이션
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    // 간단한 유효성 검사 시뮬레이션
                    if (!data.title.trim()) {
                        reject(new Error('테마 제목은 필수입니다.'));
                        return;
                    }
                    if (data.locations.length === 0) {
                        reject(new Error('최소 1개 이상의 매장 위치를 등록해주세요.'));
                        return;
                    }

                    
                    resolve(data);
                }, 1500);
            });

            // 성공 시 목록 페이지로 이동
            navigate('/escape-room', { 
                state: { 
                    message: '방탈출 테마가 성공적으로 등록되었습니다!',
                    type: 'success'
                }
            });

        } catch (err) {
            console.error('Failed to create escape room theme:', err);
            setError(err instanceof Error ? err.message : '테마 등록 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('작성 중인 내용이 사라집니다. 정말 취소하시겠습니까?')) {
            navigate('/escape-room');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 페이지 헤더 */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/escape-room')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        목록으로 돌아가기
                    </Button>
                </div>
                
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        방탈출 테마 등록
                    </h1>
                    <p className="text-gray-600 mt-2">
                        새로운 방탈출 테마를 등록하여 다른 사용자들과 공유하세요.
                    </p>
                </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* 안내 메시지 */}
            <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="text-blue-800 text-lg">
                        테마 등록 가이드
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-700 space-y-2">
                    <p className="text-sm">
                        • <strong>매장 위치:</strong> Naver Map API를 통해 정확한 매장 정보를 검색하고 등록하세요.
                    </p>

                    <p className="text-sm">
                        • <strong>난이도 설정:</strong> 초보자부터 고수까지 고려하여 적절한 난이도를 선택하세요.
                    </p>
                    <p className="text-sm">
                        • <strong>스포일러 보호:</strong> 댓글과 게임 기록은 스포일러 보호 시스템으로 관리됩니다.
                    </p>
                </CardContent>
            </Card>

            {/* 메인 폼 */}
            <Card>
                <CardContent className="p-6">
                    <EscapeRoomThemeForm
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                        mode="create"
                    />
                </CardContent>
            </Card>

            {/* 하단 도움말 */}
            <div className="mt-8 text-center text-sm text-gray-500">
                <p>
                    문제가 있거나 도움이 필요하시면{' '}
                    <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">
                        고객 지원
                    </a>
                    으로 문의해주세요.
                </p>
            </div>
        </div>
    );
};

export default EscapeRoomCreatePage;