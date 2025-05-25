import React from "react";
import PageTransition from "@/components/PageTransition";
import BotStatsSection from "@/components/home/StatsSection";
import AnnouncementSection from "@/components/home/AnnouncementSection";
import LatestPostsSection from "@/components/home/LatestPostsSection";
import GameAdsCarousel from "@/components/home/GameAdsCarousel";
import CurrentGamesSection from "@/components/home/CurrentGamesSection";
import BotAddSection from "@/components/home/BotAddSection";
import { PageSEO } from "@/components/seo";

const Index: React.FC = () => {
    // 메인 페이지 구조화된 데이터
    const organizationData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "미스터리 플레이스",
        "alternateName": "CrimeCat",
        "url": "https://crimecat.org",
        "logo": "https://crimecat.org/images/logo.png",
        "description": "크라임씬, 방탈출, 머더미스터리 게임 정보를 제공하는 커뮤니티",
        "sameAs": [
            "https://twitter.com/crimecat",
            "https://www.instagram.com/crimecat"
        ]
    };

    return (
        <PageTransition>
            <PageSEO
                title="홈"
                description="미스터리 플레이스는 크라임씬, 방탈출, 머더미스터리 게임 정보와 커뮤니티를 제공합니다. 최신 테마 정보, 공략, 리뷰를 확인하고 다른 플레이어들과 소통하세요."
                url="/"
                structuredData={organizationData}
            />
            <div className="pt-20">
                <BotAddSection />
                {/* <BotStatsSection /> */}
                <AnnouncementSection />
                <GameAdsCarousel />
                <LatestPostsSection />
                {/* <GameAdsSection />
                <CurrentGamesSection /> */}
            </div>
        </PageTransition>
    );
};

export default Index;
