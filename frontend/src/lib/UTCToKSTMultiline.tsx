import React from "react";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ko } from "date-fns/locale";

interface UTCToKSTProps {
    date: string;
}

export const UTCToKSTMultiline: React.FC<UTCToKSTProps> = ({ date }) => {
    if (!date) return <span>-</span>;

    try {
        const utc = parseISO(date.endsWith("Z") ? date : `${date}Z`);

        const datePart = formatInTimeZone(
            utc,
            "Asia/Seoul",
            "yyyy년 MM월 dd일",
            {
                locale: ko,
            }
        );
        const timePart = formatInTimeZone(utc, "Asia/Seoul", "a h시 mm분", {
            locale: ko,
        });

        return (
            <div className="flex flex-col items-center">
                <span>{datePart}</span>
                <span>{timePart}</span>
            </div>
        );
    } catch (e) {
        console.error("시간 변환 오류:", e);
        return <span>-</span>;
    }
};
