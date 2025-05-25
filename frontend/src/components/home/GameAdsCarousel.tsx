import React from "react";
import { motion } from "framer-motion";
import { Gamepad, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { themeAdsService, ThemeAdvertisement } from "@/api/admin/themeAdsService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// 테마 카드 컴포넌트들 import
import CrimesceneThemeCard from "@/components/themes/crimescene/CrimesceneThemeCard";
import EscapeRoomThemeCard from "@/components/escape-room/list/EscapeRoomThemeCard";

// 타입별 카드 컴포넌트 매핑
const ThemeCardComponents = {
    CRIMESCENE: CrimesceneThemeCard,
    ESCAPE_ROOM: EscapeRoomThemeCard,
    MURDER_MYSTERY: null, // 추후 구현
    REALWORLD: null, // 추후 구현
};

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const GameAdsCarousel: React.FC = () => {
    const swiperRef = React.useRef<SwiperType>();

    // 활성 광고 목록 조회
    const { data: advertisements = [], isLoading } = useQuery({
        queryKey: ["active-theme-ads"],
        queryFn: themeAdsService.getActiveAdvertisements,
        refetchInterval: 1000 * 60 * 5, // 5분마다 새로고침
    });

    // 광고가 없거나 로딩 중일 때
    if (isLoading) {
        return (
            <section className="py-8 px-4">
                <div className="container mx-auto">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <Gamepad className="h-5 w-5 mr-2 text-primary" />
                        추천 게임 테마
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-64 bg-muted rounded-lg animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (advertisements.length === 0) {
        return null; // 광고가 없으면 섹션 자체를 표시하지 않음
    }

    // displayOrder로 정렬
    const sortedAds = [...advertisements].sort((a, b) => a.displayOrder - b.displayOrder);

    return (
        <section className="py-8 px-4">
            <div className="container mx-auto">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Gamepad className="h-5 w-5 mr-2 text-primary" />
                    추천 게임 테마
                </h2>

                <motion.div
                    className="relative"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                >
                    <Swiper
                        ref={(swiper) => {
                            if (swiper) swiperRef.current = swiper.swiper;
                        }}
                        modules={[Navigation, Pagination, Autoplay]}
                        spaceBetween={16}
                        slidesPerView={1}
                        navigation={{
                            prevEl: ".swiper-button-prev-custom",
                            nextEl: ".swiper-button-next-custom",
                        }}
                        pagination={{
                            clickable: true,
                            dynamicBullets: true,
                        }}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                        }}
                        breakpoints={{
                            640: {
                                slidesPerView: 1,
                                spaceBetween: 16,
                            },
                            768: {
                                slidesPerView: 2,
                                spaceBetween: 20,
                            },
                            1024: {
                                slidesPerView: 3,
                                spaceBetween: 24,
                            },
                        }}
                        className="pb-12"
                    >
                        {sortedAds.map((ad) => {
                            const CardComponent = ThemeCardComponents[ad.themeType];
                            
                            if (!CardComponent || !ad.theme) {
                                return null;
                            }

                            return (
                                <SwiperSlide key={ad.id}>
                                    <CardComponent theme={ad.theme} />
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    {/* Custom Navigation Buttons */}
                    <button
                        className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-4 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                        onClick={() => swiperRef.current?.slidePrev()}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-4 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                        onClick={() => swiperRef.current?.slideNext()}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </motion.div>
            </div>

            <style jsx global>{`
                .swiper-pagination-bullet {
                    background-color: hsl(var(--muted-foreground));
                    opacity: 0.3;
                }
                
                .swiper-pagination-bullet-active {
                    background-color: hsl(var(--primary));
                    opacity: 1;
                }
                
                .swiper-slide {
                    height: auto;
                }
            `}</style>
        </section>
    );
};

export default GameAdsCarousel;
