import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Clock, Check } from "lucide-react";
import { PermissionWithStatus } from '@/api/auth';

interface PermissionButtonProps {
    permission: PermissionWithStatus;
    daysLeft: number;
    onPurchase: () => void;
    onExtend: () => void;
    isMobile?: boolean;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
    permission,
    daysLeft,
    onPurchase,
    onExtend,
    isMobile = false,
}) => {
    const buttonSize = isMobile ? "default" : "sm";
    const buttonHeight = isMobile ? "h-12" : "";
    const buttonWidth = isMobile ? "w-full" : "";
    const textSize = isMobile ? "text-lg" : "";
    const fontWeight = isMobile ? "font-medium" : "";
    const iconSize = isMobile ? "h-5 w-5" : "h-4 w-4";

    if (permission.isOwned) {
        if (permission.canExtend && daysLeft > 0) {
            return (
                <Button
                    size={buttonSize}
                    variant="outline"
                    className={`${buttonWidth} ${buttonHeight} ${textSize} ${fontWeight} border-blue-300 text-blue-700 hover:bg-blue-50`}
                    onClick={onExtend}
                >
                    <Clock className={`${iconSize} mr-${isMobile ? "2" : "1"}`} />
                    연장하기
                </Button>
            );
        } else {
            return (
                <Button
                    size={buttonSize}
                    variant="secondary"
                    className={`${buttonWidth} ${buttonHeight} ${textSize} ${fontWeight} bg-emerald-100 text-emerald-700 hover:bg-emerald-200`}
                    disabled
                >
                    <Check className={`${iconSize} mr-${isMobile ? "2" : "1"}`} />
                    {daysLeft > 0 ? "보유 중" : "만료됨"}
                </Button>
            );
        }
    }

    return (
        <Button
            size={buttonSize}
            className={`${buttonWidth} ${buttonHeight} ${textSize} ${fontWeight} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white`}
            onClick={onPurchase}
        >
            <ShoppingCart className={`${iconSize} mr-${isMobile ? "2" : "1"}`} />
            구매하기
        </Button>
    );
};
