import React from "react";
import { motion } from "framer-motion";
import { Gamepad } from "lucide-react";

const gameAds = [
    {
        id: 1,
        title: "Ep.2 독충의밤:착란의시간",
        type: "크라임씬",
        players: "6명",
        time: "3시간",
        author: "용사", // 🆕 추가
        price: "8000원", // 🆕 추가
        image: "./content/image/hero_crime_poisonNight.jpg",
    },
    {
        id: 2,
        title: "Ep.3 나비인간:환상의빛",
        type: "크라임씬",
        players: "6명",
        time: "3시간 30분",
        author: "용사", // 🆕 추가
        price: "10,000원", // 🆕 추가
        image: "./content/image/hero_crime_butterfly.png",
    },
    {
        id: 3,
        title: "Ep.4 곡두곡예:추락열차",
        type: "크라임씬",
        players: "6명",
        time: "5시간",
        author: "용사", // 🆕 추가
        price: "15,000원", // 🆕 추가
        image: "./content/image/hero_crime.png",
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
                            <div className="h-40 flex items-center justify-center overflow-hidden bg-muted">
                                <img
                                    src={ad.image ?? "/content/image/default_crime_scene_image.png"}
                                    alt={ad.title}
                                    className="max-h-full object-contain"
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
