import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { noticesService } from "@/api/noticesService";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { isWithinDays } from "@/utils/highlight";
import { UTCToKST } from "@/lib/dateFormat";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
    },
};

const noticeTypeBadge = (type: string) => {
    switch (type) {
        case "SYSTEM":
            return (
                <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-600"
                >
                    시스템
                </Badge>
            );
        case "EVENT":
            return (
                <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                >
                    이벤트
                </Badge>
            );
        case "UPDATE":
            return (
                <Badge
                    variant="outline"
                    className="text-purple-600 border-purple-600"
                >
                    업데이트
                </Badge>
            );
        default:
            return null;
    }
};

const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    return d.toLocaleString(
        "ko-KR",
        isMobile
            ? {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
              }
            : {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
              }
    );
};

const AnnouncementSection: React.FC = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["latest-notices"],
        queryFn: noticesService.getLatestNotices,
    });

    const navigate = useNavigate();

    return (
        <section className="py-8 px-4">
            <div className="container mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center">
                        <Megaphone className="h-5 w-5 mr-2 text-primary" />
                        공지사항
                    </h2>
                    <Link to="/notices">
                        <Button variant="ghost" size="sm" className="text-sm">
                            더보기 <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <Skeleton key={idx} className="h-20 rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        className="space-y-3"
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                    >
                        {data?.map((notice) => {
                            const isNew = isWithinDays(notice.createdAt, 7);
                            const isUpdated = isWithinDays(notice.updatedAt, 7);

                            return (
                                <motion.div
                                    key={notice.id}
                                    className="glass p-4 rounded-lg cursor-pointer hover:bg-slate-100/5 transition-colors"
                                    variants={item}
                                    onClick={() =>
                                        navigate(`/notices/${notice.id}`)
                                    }
                                >
                                    {/* 모바일 레이아웃: 날짜와 뱃지를 위로 */}
                                    <div className="block sm:flex sm:justify-between sm:items-start mb-1">
                                        <div className="flex items-center gap-2 flex-wrap text-sm mb-1 sm:mb-0">
                                            {noticeTypeBadge(notice.noticeType)}
                                            {isNew && (
                                                <span className="twinkle-badge twinkle-badge-yellow">
                                                    New
                                                </span>
                                            )}
                                            {isUpdated &&
                                                (!isNew ||
                                                    notice.createdAt !==
                                                        notice.updatedAt) && (
                                                    <span className="twinkle-badge twinkle-badge-blue">
                                                        Updated
                                                    </span>
                                                )}
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap sm:text-right">
                                            <UTCToKST date={notice.createdAt} />
                                        </span>
                                    </div>

                                    {/* 제목 */}
                                    <h3 className="text-base font-semibold line-clamp-2 mb-1">
                                        {notice.title}
                                    </h3>

                                    {/* 요약 */}
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {notice.summary || notice.content}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {error && (
                    <p className="text-sm text-red-500 mt-2">
                        공지사항을 불러오는 데 실패했습니다.
                    </p>
                )}
            </div>
        </section>
    );
};

export default AnnouncementSection;
