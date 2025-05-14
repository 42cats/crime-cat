import { PermissionWithStatus } from "@/api/permissionService";

// 만료일까지 남은 일수 계산
export const getDaysUntilExpiry = (expiredDate: string) => {
    const today = new Date();
    const expiry = new Date(expiredDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// 만료 상태에 따른 색상 결정
export const getExpiryStatus = (permission: PermissionWithStatus) => {
    if (!permission.isOwned || !permission.expiredDate) {
        return {
            color: "text-gray-500",
            bgColor: "bg-gray-50",
            urgency: "normal" as const,
        };
    }

    const daysLeft = getDaysUntilExpiry(permission.expiredDate);
    if (daysLeft <= 3)
        return {
            color: "text-red-600",
            bgColor: "bg-red-50",
            urgency: "critical" as const,
        };
    if (daysLeft <= 7)
        return {
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            urgency: "warning" as const,
        };
    return {
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        urgency: "normal" as const,
    };
};

// 진행률 계산
export const getProgress = (daysLeft: number, duration: number) => {
    return Math.max(0, Math.min(100, (daysLeft / duration) * 100));
};

// 뱃지 스타일 클래스
export const getBadgeClasses = (urgency: 'critical' | 'warning' | 'normal') => {
    return `px-3 py-1 text-xs ${
        urgency === "critical"
            ? "bg-red-500 hover:bg-red-600"
            : urgency === "warning"
            ? "bg-orange-500 hover:bg-orange-600"
            : "bg-emerald-500 hover:bg-emerald-600"
    }`;
};

// 진행률 바 클래스
export const getProgressBarClasses = (urgency: 'critical' | 'warning' | 'normal') => {
    return `h-full transition-all duration-300 ${
        urgency === "critical"
            ? "bg-red-500"
            : urgency === "warning"
            ? "bg-orange-500"
            : "bg-emerald-500"
    }`;
};

// 공통 인터페이스
export interface PermissionCardProps {
    permission: PermissionWithStatus;
    formatDate: (date: string) => React.ReactNode;
    onPurchase: () => void;
    onExtend: () => void;
}
