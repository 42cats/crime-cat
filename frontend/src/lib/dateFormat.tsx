import React from "react";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ko } from "date-fns/locale";

interface UTCToKSTProps {
    /** ISO-8601 문자열 (예: 2025-04-27T13:23:00Z) */
    date: string;
}

export const UTCToKST: React.FC<UTCToKSTProps> = ({ date }) => {
    if (!date) return <span>-</span>;

    try {
        // Z(UTC 표식)가 없으면 보정
        const utc = parseISO(date.endsWith("Z") ? date : `${date}Z`);

        // yyyy년 MM월 dd일 오전/오후 h시 mm분
        const text = formatInTimeZone(
            utc,
            "Asia/Seoul",
            "yyyy년 MM월 dd일 a h시 mm분",
            { locale: ko }
        );

        return <span>{text}</span>;
    } catch (e) {
        console.error("시간 변환 오류:", e);
        return <span>-</span>;
    }
};
