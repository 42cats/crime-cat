import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Gamepad, ChevronLeft, ChevronRight, Sparkles, Coins, TrendingUp, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    queueThemeAdsService,
    QueueThemeAdvertisement,
} from "@/api/admin/queueThemeAdsService";
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
    const navigate = useNavigate();

    // 활성 광고 목록 조회 (새로운 큐 시스템)
    const { data: advertisements = [], isLoading, error } = useQuery({
        queryKey: ["active-queue-theme-ads"],
        queryFn: queueThemeAdsService.getActiveAdvertisements,
        refetchInterval: 1000 * 60 * 5, // 5분마다 새로고침
    });

    // 디버깅용 로그
    useEffect(() => {
        if (advertisements) {
            console.log("광고 데이터:", advertisements);
            console.log("광고 개수:", advertisements.length);
            if (advertisements.length > 0) {
                console.log("첫 번째 광고:", advertisements[0]);
            }
        }
        if (error) {
            console.error("광고 데이터 조회 실패:", error);
        }
    }, [advertisements, error]);

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

    // 광고가 없을 때 홍보 섹션 표시
    if (advertisements.length === 0) {
        return (
            <section className="py-8 px-4">
                <div className="container mx-auto">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <Gamepad className="h-5 w-5 mr-2 text-primary" />
                        추천 게임 테마
                    </h2>
                    
                    <motion.div
                        className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                내 테마를 홍보해보세요!
                            </h3>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                테마 광고로 더 많은 플레이어들에게 노출시키고
                                <br />
                                게임 참여율을 높여보세요!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
                                <Badge variant="secondary" className="text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30">
                                    <Coins className="w-4 h-4 mr-1" />
                                    100P/일부터 시작
                                </Badge>
                                <Badge variant="secondary" className="text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    즉시 노출 가능
                                </Badge>
                            </div>
                            <Button 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                                onClick={() => navigate('/dashboard/theme-ads')}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                광고 신청하기
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        );
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
                                        <div 
                                            onClick={() => {
                                                // 광고 클릭 기록
                                                queueThemeAdsService.recordClick(ad.id).catch(err => 
                                                    console.warn("클릭 기록 실패:", err)
                                                );
                                            }}
                                        >
                                            <CardComponent
                                                theme={ad.theme}
                                                index={0}
                                            />
                                        </div>
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
