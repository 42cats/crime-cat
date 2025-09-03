import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

interface MobileScheduleModalProps {
    showMobileScheduleText: boolean;
    mobileScheduleText: string;
    onClose: () => void;
    copyToClipboard: (text: string) => Promise<boolean>;
}

const MobileScheduleModal: React.FC<MobileScheduleModalProps> = ({
    showMobileScheduleText,
    mobileScheduleText,
    onClose,
    copyToClipboard,
}) => {
    const { toast } = useToast();

    if (!showMobileScheduleText || !mobileScheduleText) return null;

    const handleRetryClick = async () => {
        // 재시도 버튼
        const success = await copyToClipboard(mobileScheduleText);
        if (success) {
            toast({
                title: "복사 성공!",
                description: "일정이 클립보드에 복사되었습니다.",
                duration: 2000,
            });
            onClose();
        }
    };

    return (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    📋 일정 텍스트 복사
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-6 w-6 p-0 text-blue-600"
                >
                    ×
                </Button>
            </div>
            <p className="text-xs text-blue-700 mb-2">
                아래 텍스트를 길게 누르고 선택하여 복사하세요
            </p>
            <textarea
                readOnly
                value={mobileScheduleText}
                className="w-full h-20 p-2 text-xs border border-blue-300 rounded bg-white resize-none"
                onFocus={(e) => e.target.select()}
                onTouchStart={(e) => {
                    // 모바일에서 텍스트 선택 도움
                    setTimeout(() => {
                        e.currentTarget.select();
                    }, 100);
                }}
            />
            <div className="mt-2 flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryClick}
                    className="text-xs"
                >
                    🔄 다시 복사 시도
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="text-xs"
                >
                    닫기
                </Button>
            </div>
        </div>
    );
};

export default MobileScheduleModal;