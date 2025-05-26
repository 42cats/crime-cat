import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeAdvertisement } from "@/api/admin/themeAdsService";
import { useMutation } from "@tanstack/react-query";
import { themeAdsService } from "@/api/admin/themeAdsService";
import { toast } from "sonner";
import ThemeAdForm from "./ThemeAdForm";
import { Theme } from "@/lib/types";

interface ThemeAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    advertisement: ThemeAdvertisement | null;
}

export interface ThemeAdFormData {
    theme: Theme | null;
    themeType: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD";
    startDate: Date;
    endDate: Date;
    displayOrder?: number;
    isActive?: boolean;
}

const ThemeAdModal: React.FC<ThemeAdModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    advertisement,
}) => {
    const [formData, setFormData] = useState<ThemeAdFormData>({
        theme: null,
        themeType: "CRIMESCENE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
        displayOrder: undefined,
        isActive: true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // 광고 생성 mutation
    const createMutation = useMutation({
        mutationFn: themeAdsService.createAdvertisement,
        onSuccess: () => {
            toast.success("광고가 생성되었습니다.");
            onSuccess();
        },
        onError: (error) => {
            toast.error((error as Error).message || "광고 생성에 실패했습니다.");
        },
    });

    // 광고 수정 mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: {
            startDate: string;
            endDate: string;
            displayOrder?: number;
            isActive?: boolean;
        } }) =>
            themeAdsService.updateAdvertisement(id, data),
        onSuccess: () => {
            toast.success("광고가 수정되었습니다.");
            onSuccess();
        },
        onError: (error) => {
            toast.error((error as Error).message || "광고 수정에 실패했습니다.");
        },
    });

    // 광고 정보로 폼 초기화
    useEffect(() => {
        if (advertisement) {
            setFormData({
                theme: advertisement.theme || null,
                themeType: advertisement.themeType,
                startDate: new Date(advertisement.startDate),
                endDate: new Date(advertisement.endDate),
                displayOrder: advertisement.displayOrder,
                isActive: advertisement.isActive,
            });
        } else {
            // 새 광고 추가 시 폼 초기화
            setFormData({
                theme: null,
                themeType: "CRIMESCENE",
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                displayOrder: undefined,
                isActive: true,
            });
        }
    }, [advertisement]);

    const handleSubmit = async () => {
        if (!formData.theme) {
            toast.error("테마를 선택해주세요.");
            return;
        }

        if (formData.startDate >= formData.endDate) {
            toast.error("종료 날짜는 시작 날짜보다 늦어야 합니다.");
            return;
        }

        setIsSubmitting(true);

        try {
            if (advertisement) {
                // 수정
                await updateMutation.mutateAsync({
                    id: advertisement.id,
                    data: {
                        startDate: formData.startDate.toISOString(),
                        endDate: formData.endDate.toISOString(),
                        displayOrder: formData.displayOrder,
                        isActive: formData.isActive,
                    },
                });
            } else {
                // 생성
                await createMutation.mutateAsync({
                    themeId: formData.theme.id,
                    themeType: formData.themeType,
                    startDate: formData.startDate.toISOString(),
                    endDate: formData.endDate.toISOString(),
                    displayOrder: formData.displayOrder,
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {advertisement ? "광고 수정" : "광고 추가"}
                    </DialogTitle>
                </DialogHeader>

                <ThemeAdForm
                    formData={formData}
                    setFormData={setFormData}
                    isEditing={!!advertisement}
                />

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        취소
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !formData.theme}
                    >
                        {isSubmitting ? "처리 중..." : advertisement ? "수정" : "추가"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ThemeAdModal;
