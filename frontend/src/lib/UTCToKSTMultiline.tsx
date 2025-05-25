import React from "react";
import { parseISO } from "date-fns";

interface UTCToKSTProps {
    date: string;
}

const getRelativeTimeDetail = (date: Date): { unit: string; value: number } => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return { unit: "일 전", value: days };
    if (hours > 0) return { unit: "시간 전", value: hours };
    if (minutes > 0) return { unit: "분 전", value: minutes };
    return { unit: "", value: 0 };
};

export const UTCToKSTMultiline: React.FC<UTCToKSTProps> = ({ date }) => {
    if (!date) return <span>-</span>;

    try {
        const utcDate = parseISO(date.endsWith("Z") ? date : `${date}Z`);
        const { unit, value } = getRelativeTimeDetail(utcDate);

        return (
            <div className="flex flex-col items-center">
                {value === 0 ? (
                    <span className="text-sm">방금 전</span>
                ) : (
                    <>
                        <span className="text-sm">{value}</span>
                        <span className="text-xs text-gray-500">{unit}</span>
                    </>
                )}
            </div>
        );
    } catch (e) {
        console.error("시간 변환 오류:", e);
        return <span>-</span>;
    }
};
