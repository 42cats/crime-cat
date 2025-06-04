import React, { useState, useRef, useEffect, useMemo } from "react";
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

// 개선된 카드 크기 설정 상수
const CARD_SIZE_CONFIG = {
    // 카드 최적 크기 (CSS Grid auto-fit 기반)
    optimalWidth: "220px",
    minWidth: "180px", 
    maxWidth: "280px",
    aspectRatio: "3/4", // 고정 비율 (너비:높이 = 3:4)
    height: "auto",
    
    // CSS Grid 기반 반응형 설정
    gridConfig: {
        minCardWidth: "180px",
        maxCardWidth: "220px", 
        gap: "16px"
    },

    // 로딩 스켈레톤 높이 
    skeletonHeight: "h-64",

    // 반응형 설정
    responsive: {
        mobile: {
            slidesPerView: 1.2,
            spaceBetween: 12,
        },
        tablet: {
            slidesPerView: 2.5,
            spaceBetween: 16,
        },
        desktop: {
            slidesPerView: 3.5,
            spaceBetween: 20,
        },
        wide: {
            slidesPerView: 4.5,
            spaceBetween: 24,
        },
        ultrawide: {
            slidesPerView: 5.5,
            spaceBetween: 28,
        },
    },
};

// 동적 반응형 계산을 위한 커스텀 훅
const useResponsiveCarousel = () => {
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // 컨테이너 크기 측정
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        
        // 초기 측정
        updateWidth();
        
        // 리사이즈 이벤트 리스너
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);
    
    // 동적 carousel 설정 계산
    const carouselConfig = useMemo(() => {
        const cardWidth = 220; // 기본 카드 너비
        const gap = 16; // 카드 간격
        const padding = 32; // 좌우 패딩
        
        const availableWidth = containerWidth - padding;
        const maxSlides = Math.floor(availableWidth / (cardWidth + gap));
        
        const slidesPerView = Math.max(1, Math.min(maxSlides, 6));
        
        return {
            slidesPerView,
            spaceBetween: gap,
            cardStyle: {
                width: `clamp(${CARD_SIZE_CONFIG.minWidth}, 20vw, ${CARD_SIZE_CONFIG.maxWidth})`,
                aspectRatio: CARD_SIZE_CONFIG.aspectRatio,
                minWidth: CARD_SIZE_CONFIG.minWidth,
                maxWidth: CARD_SIZE_CONFIG.maxWidth,
            }
        };
    }, [containerWidth]);
    
    return { containerRef, carouselConfig };
};

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const GameAdsCarousel: React.FC = () => {
    const swiperRef = useRef<SwiperType>();
    const { containerRef, carouselConfig } = useResponsiveCarousel();

    // 활성 광고 목록 조회
    const { data: advertisements = [], isLoading } = useQuery({
        queryKey: ["active-theme-ads"],
        queryFn: themeAdsService.getActiveAdvertisements,
        refetchInterval: 1000 * 60 * 5, // 5분마다 새로고침
    });

    // 로딩 상태에서 표시할 스켈레톤 개수 동적 계산
    const skeletonCount = useMemo(() => {
        if (typeof window === 'undefined') return 4;
        const width = window.innerWidth;
        if (width < 768) return 2;
        if (width < 1024) return 3;
        if (width < 1280) return 4;
        return 5;
    }, []);

    // 광고가 없거나 로딩 중일 때
    if (isLoading) {
        return (
            <section className="py-8 px-4">
                <div className="container mx-auto" ref={containerRef}>
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <Gamepad className="h-5 w-5 mr-2 text-primary" />
                        추천 게임 테마
                    </h2>
                    <div 
                        className="grid gap-4"
                        style={{
                            gridTemplateColumns: `repeat(auto-fit, minmax(${CARD_SIZE_CONFIG.gridConfig.minCardWidth}, ${CARD_SIZE_CONFIG.gridConfig.maxCardWidth}))`,
                            gap: CARD_SIZE_CONFIG.gridConfig.gap,
                            justifyContent: 'center'
                        }}
                    >
                        {Array.from({ length: skeletonCount }, (_, i) => (
                            <div
                                key={i}
                                className={`${CARD_SIZE_CONFIG.skeletonHeight} bg-muted rounded-lg animate-pulse`}
                                style={carouselConfig.cardStyle}
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
