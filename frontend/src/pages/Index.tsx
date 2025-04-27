import React from "react";
import PageTransition from "@/components/PageTransition";
import BotStatsSection from "@/components/home/StatsSection";
import AnnouncementSection from "@/components/home/AnnouncementSection";
import LatestPostsSection from "@/components/home/LatestPostsSection";
import GameAdsSection from "@/components/home/GameAdsSection";
import CurrentGamesSection from "@/components/home/CurrentGamesSection";

const Index: React.FC = () => {
    return (
        <PageTransition>
            <div className="pt-20">
                <BotStatsSection />
                <AnnouncementSection />
                {/* <LatestPostsSection />
        <GameAdsSection />
        <CurrentGamesSection /> */}
            </div>
        </PageTransition>
    );
};

export default Index;
