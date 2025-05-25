import React from "react";
import { parseISO, format } from "date-fns";

interface UTCToKSTProps {
    /** ISO-8601 문자열 (예: 2025-04-27T13:23:00Z) */
    date: string;
}

const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return format(date, "yyyy.MM.dd"); // ✅ 날짜 표시로 변경
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return "방금 전";
};

export const UTCToKST: React.FC<UTCToKSTProps> = ({ date }) => {
    if (!date) return <span>-</span>;

    try {
        const utcDate = parseISO(date.endsWith("Z") ? date : `${date}Z`);
        return <span>{getRelativeTime(utcDate)}</span>;
    } catch (e) {
        console.error("시간 변환 오류:", e);
        return <span>-</span>;
    }
};
