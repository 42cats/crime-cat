import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EscapeRoomLocation } from '@/lib/types';
import LocationSelector from '../location/LocationSelector';

import DifficultySelector from './DifficultySelector';
import ParticipantSettings from './ParticipantSettings';
import TimeSettings from './TimeSettings';
import PriceSettings from './PriceSettings';
import UrlSettings from './UrlSettings';

interface EscapeRoomThemeFormData {
    title: string;
    description: string;
    locations: EscapeRoomLocation[];

    difficulty: number;
    minParticipants: number;
    maxParticipants: number;
    estimatedDuration: number;
    price: number;
    homepageUrl: string;
    reservationUrl: string;
    isActive: boolean;
    allowComments: boolean;
    allowGameHistory: boolean;
}

interface EscapeRoomThemeFormProps {
    initialData?: Partial<EscapeRoomThemeFormData>;
    onSubmit: (data: EscapeRoomThemeFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    mode: 'create' | 'edit';
}

const EscapeRoomThemeForm: React.FC<EscapeRoomThemeFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    mode = 'create'
}) => {
    const [formData, setFormData] = useState<EscapeRoomThemeFormData>({
        title: '',
        description: '',
        locations: [],

        difficulty: 3,
        minParticipants: 2,
        maxParticipants: 6,
        estimatedDuration: 60,
        price: 0,
        homepageUrl: '',
        reservationUrl: '',
        isActive: true,
        allowComments: true,
        allowGameHistory: true,
        ...initialData
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = '테마 제목을 입력해주세요.';
        }

        if (!formData.description.trim()) {
            newErrors.description = '테마 설명을 입력해주세요.';
        }

        if (formData.locations.length === 0) {
            newErrors.locations = '최소 1개 이상의 매장 위치를 등록해주세요.';
        }



        if (formData.minParticipants > formData.maxParticipants) {
            newErrors.participants = '최소 인원이 최대 인원보다 클 수 없습니다.';
        }

        if (formData.price < 0) {
            newErrors.price = '가격은 0원 이상이어야 합니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Failed to submit form:', error);
        }
    };

    const updateFormData = (field: keyof EscapeRoomThemeFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // 에러 클리어
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            {/* 기본 정보 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        기본 정보
                        <Badge variant="outline">필수</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 테마 제목 */}
                    <div>
                        <Label htmlFor="title">테마 제목</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => updateFormData('title', e.target.value)}
                            placeholder="방탈출 테마 제목을 입력하세요"
                            className={errors.title ? 'border-red-500' : ''}
                            disabled={isLoading}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                        )}
                    </div>

                    {/* 테마 설명 */}
                    <div>
                        <Label htmlFor="description">테마 설명</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => updateFormData('description', e.target.value)}
                            placeholder="테마의 스토리, 특징, 주의사항 등을 자세히 설명해주세요"
                            rows={4}
                            className={errors.description ? 'border-red-500' : ''}
                            disabled={isLoading}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 매장 위치 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        매장 위치
                        <Badge variant="outline">필수</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <LocationSelector
                        locations={formData.locations}
                        onLocationsChange={(locations) => updateFormData('locations', locations)}
                        description="이 테마를 플레이할 수 있는 방탈출 매장을 검색하고 등록하세요"
                        required
                        maxLocations={5}
                        disabled={isLoading}
                    />
                    {errors.locations && (
                        <p className="text-sm text-red-500 mt-2">{errors.locations}</p>
                    )}
                </CardContent>
            </Card>



            {/* 게임 설정 */}
            <Card>
                <CardHeader>
                    <CardTitle>게임 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 난이도 */}
                    <DifficultySelector
                        difficulty={formData.difficulty}
                        onDifficultyChange={(difficulty) => updateFormData('difficulty', difficulty)}
                        disabled={isLoading}
                    />

                    <Separator />

                    {/* 참가 인원 */}
                    <ParticipantSettings
                        minParticipants={formData.minParticipants}
                        maxParticipants={formData.maxParticipants}
                        onMinChange={(min) => updateFormData('minParticipants', min)}
                        onMaxChange={(max) => updateFormData('maxParticipants', max)}
                        error={errors.participants}
                        disabled={isLoading}
                    />

                    <Separator />

                    {/* 시간 설정 */}
                    <TimeSettings
                        estimatedDuration={formData.estimatedDuration}
                        onDurationChange={(duration) => updateFormData('estimatedDuration', duration)}
                        disabled={isLoading}
                    />

                    <Separator />

                    {/* 가격 설정 */}
                    <PriceSettings
                        price={formData.price}
                        onPriceChange={(price) => updateFormData('price', price)}
                        error={errors.price}
                        disabled={isLoading}
                    />

                    <Separator />

                    {/* URL 설정 */}
                    <UrlSettings
                        homepageUrl={formData.homepageUrl}
                        reservationUrl={formData.reservationUrl}
                        onHomepageUrlChange={(url) => updateFormData('homepageUrl', url)}
                        onReservationUrlChange={(url) => updateFormData('reservationUrl', url)}
                        disabled={isLoading}
                    />
                </CardContent>
            </Card>

            {/* 권한 설정 */}
            <Card>
                <CardHeader>
                    <CardTitle>권한 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="allowComments">댓글 허용</Label>
                            <p className="text-sm text-gray-500">
                                사용자들이 이 테마에 댓글을 달 수 있도록 허용합니다
                            </p>
                        </div>
                        <Switch
                            id="allowComments"
                            checked={formData.allowComments}
                            onCheckedChange={(checked) => updateFormData('allowComments', checked)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="allowGameHistory">게임 기록 허용</Label>
                            <p className="text-sm text-gray-500">
                                사용자들이 이 테마의 플레이 기록을 등록할 수 있도록 허용합니다
                            </p>
                        </div>
                        <Switch
                            id="allowGameHistory"
                            checked={formData.allowGameHistory}
                            onCheckedChange={(checked) => updateFormData('allowGameHistory', checked)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="isActive">테마 활성화</Label>
                            <p className="text-sm text-gray-500">
                                비활성화하면 사용자들이 이 테마를 검색하거나 볼 수 없습니다
                            </p>
                        </div>
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => updateFormData('isActive', checked)}
                            disabled={isLoading}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 제출 버튼 */}
            <div className="flex gap-3 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    취소
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? '저장 중...' : mode === 'create' ? '테마 생성' : '테마 수정'}
                </Button>
            </div>
        </form>
    );
};

export default EscapeRoomThemeForm;