import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { statsService } from '@/api/stats';
import { Skeleton } from "@/components/ui/skeleton";

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

const formatNumber = (value?: number | string) =>
    typeof value === "number" ? value.toLocaleString("ko-KR") : value ?? "0";

const StatsSection: React.FC = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["main-stats"],
        queryFn: statsService.fetchStats,
    });

    const renderCard = (
        label: string,
        value?: number | string,
        isError?: boolean
    ) => (
        <motion.div
            className="glass p-6 rounded-lg text-center hover:bg-slate-50/5 transition-colors"
            variants={item}
        >
            <h3 className="text-2xl font-bold text-primary mb-2">
                {isError ? "0" : formatNumber(value)}
            </h3>
            <p className="text-sm text-muted-foreground">{label}</p>
        </motion.div>
    );

    return (
        <section className="py-8 px-4 bg-gradient-to-b from-transparent to-slate-50/5">
            <div className="container mx-auto">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <Skeleton key={idx} className="h-24 rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <>
                        <motion.div
                            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
                            variants={container}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                        >
                            {renderCard(
                                "등록된 제작자",
                                data?.totalCreators,
                                !!error
                            )}
                            {renderCard(
                                "등록된 테마",
                                data?.totalThemes,
                                !!error
                            )}
                            {renderCard("전체 유저", data?.totalUsers, !!error)}
                            {renderCard(
                                "등록된 디스코드 서버",
                                data?.totalServers,
                                !!error
                            )}
                            {renderCard(
                                "플레이 기록",
                                data?.totalPlayers,
                                !!error
                            )}
                        </motion.div>

                        {error && (
                            <div className="text-center text-red-500 text-sm mt-4">
                                스탯 조회에 실패했습니다. 잠시 후 다시
                                시도해주세요.
                            </div>
                        )}

                        {/* ✅ 봇 추가 버튼 */}
                        <motion.div
                            className="flex justify-center mt-12"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <a
                                href="https://discord.com/oauth2/authorize?client_id=1069990761778659458"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/90 transition-colors"
                            >
                                디스코드에 봇 추가하기 🚀
                            </a>
                        </motion.div>
                    </>
                )}
            </div>
        </section>
    );
};

export default StatsSection;
