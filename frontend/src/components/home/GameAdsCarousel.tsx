import React from "react";
import { motion } from "framer-motion";
import { Gamepad, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    themeAdsService,
    ThemeAdvertisement,
} from "@/api/admin/themeAdsService";
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

// 카드 크기 설정 상수
const CARD_SIZE_CONFIG = {
    // 카드 최소/최대 크기
    minWidth: "180px", // 최소 너비
    maxWidth: "200px", // 최대 너비
    height: "260px", // 고정 높이 (auto로 설정하면 컨텐츠에 맞춤)

    // 로딩 스켈레톤 높이
    skeletonHeight: "h-64", // Tailwind 클래스 (h-64 = 256px)

    // 반응형 슬라이드 개수 및 간격
    responsive: {
        mobile: {
            slidesPerView: 2, // 360px 화면에서 2개 (180px * 2)
            spaceBetween: 12, // 작은 카드니까 간격도 줄임
        },
        tablet: {
            slidesPerView: 3, // 768px 화면에서 3개
            spaceBetween: 16,
        },
        desktop: {
            slidesPerView: 5, // 1024px 화면에서 5개
            spaceBetween: 20,
        },
        wide: {
            slidesPerView: 6, // 1536px 화면에서 6개
            spaceBetween: 24,
        },
        ultrawide: {
            slidesPerView: 8, // 1920px 화면에서 8개
            spaceBetween: 24,
        },
    },
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className={`${CARD_SIZE_CONFIG.skeletonHeight} bg-muted rounded-lg animate-pulse`}
                                style={{
                                    minWidth: CARD_SIZE_CONFIG.minWidth,
                                    maxWidth: CARD_SIZE_CONFIG.maxWidth,
                                }}
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
    const sortedAds = [...advertisements].sort(
        (a, b) => a.displayOrder - b.displayOrder
    );

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
                        spaceBetween={
                            CARD_SIZE_CONFIG.responsive.mobile.spaceBetween
                        }
                        slidesPerView={
                            CARD_SIZE_CONFIG.responsive.mobile.slidesPerView
                        }
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
                            360: {
                                slidesPerView:
                                    CARD_SIZE_CONFIG.responsive.mobile
                                        .slidesPerView,
                                spaceBetween:
                                    CARD_SIZE_CONFIG.responsive.mobile
                                        .spaceBetween,
                            },
                            768: {
                                slidesPerView:
                                    CARD_SIZE_CONFIG.responsive.tablet
                                        .slidesPerView,
                                spaceBetween:
                                    CARD_SIZE_CONFIG.responsive.tablet
                                        .spaceBetween,
                            },
                            1024: {
                                slidesPerView:
                                    CARD_SIZE_CONFIG.responsive.desktop
                                        .slidesPerView,
                                spaceBetween:
                                    CARD_SIZE_CONFIG.responsive.desktop
                                        .spaceBetween,
                            },
                            1536: {
                                slidesPerView:
                                    CARD_SIZE_CONFIG.responsive.wide
                                        .slidesPerView,
                                spaceBetween:
                                    CARD_SIZE_CONFIG.responsive.wide
                                        .spaceBetween,
                            },
                            1920: {
                                slidesPerView:
                                    CARD_SIZE_CONFIG.responsive.ultrawide
                                        .slidesPerView,
                                spaceBetween:
                                    CARD_SIZE_CONFIG.responsive.ultrawide
                                        .spaceBetween,
                            },
                        }}
                        className="pb-12"
                    >
                        {sortedAds.map((ad) => {
                            const CardComponent =
                                ThemeCardComponents[ad.themeType];

                            // theme 및 theme.type 존재 여부 확인
                            if (!CardComponent || !ad.theme || !ad.theme.type) {
                                console.warn(
                                    `Invalid advertisement data for ad ${ad.id}:`,
                                    {
                                        hasTheme: !!ad.theme,
                                        hasType: !!ad.theme?.type,
                                        themeType: ad.themeType,
                                    }
                                );
                                return null;
                            }

                            return (
                                <SwiperSlide key={ad.id} className="h-full">
                                    <div
                                        className="h-full"
                                        style={{
                                            minWidth: CARD_SIZE_CONFIG.minWidth,
                                            maxWidth: CARD_SIZE_CONFIG.maxWidth,
                                            height:
                                                CARD_SIZE_CONFIG.height ===
                                                "auto"
                                                    ? "auto"
                                                    : CARD_SIZE_CONFIG.height,
                                            margin: "0 auto",
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <CardComponent
                                            theme={ad.theme}
                                            index={0}
                                        />
                                    </div>
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

            {/* Swiper 커스텀 스타일 */}
            <style>
                {`
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
                `}
            </style>
        </section>
    );
};

export default GameAdsCarousel;
