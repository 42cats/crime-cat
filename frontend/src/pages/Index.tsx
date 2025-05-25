import React from "react";
import PageTransition from "@/components/PageTransition";
import BotStatsSection from "@/components/home/StatsSection";
import AnnouncementSection from "@/components/home/AnnouncementSection";
import LatestPostsSection from "@/components/home/LatestPostsSection";
import GameAdsCarousel from "@/components/home/GameAdsCarousel";
import CurrentGamesSection from "@/components/home/CurrentGamesSection";
import BotAddSection from "@/components/home/BotAddSection";

const Index: React.FC = () => {
    return (
        <PageTransition>
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
