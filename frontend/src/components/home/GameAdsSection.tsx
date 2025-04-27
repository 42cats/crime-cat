import React from "react";
import { motion } from "framer-motion";
import { Gamepad } from "lucide-react";

const gameAds = [
    {
        id: 1,
        title: "어둠의 저택",
        type: "머더미스터리",
        players: "6-12명",
        time: "120분",
        author: "크라임캣 스튜디오", // 🆕 추가
        price: "25,000원", // 🆕 추가
        image: "https://images.unsplash.com/photo-1505409859467-3a796fd5798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    {
        id: 2,
        title: "타임 트래블러",
        type: "방탈출",
        players: "4-6명",
        time: "90분",
        author: "이스케이프 랩", // 🆕 추가
        price: "18,000원", // 🆕 추가
        image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    {
        id: 3,
        title: "도시의 비밀",
        type: "리얼월드",
        players: "8-16명",
        time: "180분",
        author: "어반 미스터리", // 🆕 추가
        price: "30,000원", // 🆕 추가
        image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
];

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const GameAdsSection: React.FC = () => {
    return (
        <section className="py-8 px-4">
            <div className="container mx-auto">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Gamepad className="h-5 w-5 mr-2 text-primary" />
                    추천 게임 테마
                </h2>
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                >
                    {gameAds.map((ad) => (
                        <motion.a
                            key={ad.id}
                            href="#"
                            className="block glass overflow-hidden rounded-lg transition-all hover:shadow-lg hover:shadow-primary/10"
                            variants={item}
                        >
                            <div className="h-40 overflow-hidden">
                                <img
                                    src={ad.image}
                                    alt={ad.title}
                                    className="w-full h-full object-cover transition-transform hover:scale-105"
                                />
                            </div>
                            <div className="p-4">
                                <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full mb-2">
                                    {ad.type}
                                </div>
                                <h3 className="text-lg font-bold mb-1">
                                    {ad.title}
                                </h3>

                                {/* 제작자 표시 */}
                                <div className="text-xs text-muted-foreground mb-2">
                                    제작: {ad.author}
                                </div>

                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>플레이어: {ad.players}</span>
                                    <span>시간: {ad.time}</span>
                                </div>

                                {/* 가격 표시 */}
                                <div className="text-right text-sm font-semibold mt-2 text-primary">
                                    {ad.price}
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default GameAdsSection;
