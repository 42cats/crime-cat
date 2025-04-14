import React from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero: React.FC = () => {
    const scrollToFeatures = () => {
        document
            .getElementById("features")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-20">
            {/* 배경 요소 */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl animate-float" />
                <div
                    className="absolute bottom-1/3 right-1/5 w-72 h-72 bg-blue-300/10 rounded-full filter blur-3xl animate-float"
                    style={{ animationDelay: "1s" }}
                />
            </div>

            {/* 콘텐츠 */}
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                <div className="inline-block glass rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                    <span className="bg-primary h-2 w-2 rounded-full inline-block mr-2"></span>
                    짭냥이 봇과 함께하는 디스코드 자동화의 시작
                </div>

                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                    음악, 주소, 커맨드 관리까지
                    <br />
                    <span className="block">한 번에</span>
                </h1>

                <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
                    명령어와 버튼으로 유튜브 음악을 재생하고, 커뮤니티를 더
                    편리하게 운영하세요. 자동화와 재미를 동시에 제공하는 지능형
                    디스코드 봇입니다.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button size="lg" className="group" asChild>
                        <a
                            href="https://discord.com/oauth2/authorize?client_id=1069990761778659458"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            디스코드에 추가하기
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </a>
                    </Button>

                    <Link to="/commands">
                        <Button variant="outline" size="lg">
                            전체 명령어 보기
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 스크롤 인디케이터 */}
            <div
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer animate-pulse-subtle"
                onClick={scrollToFeatures}
            >
                <ArrowDown className="h-6 w-6 text-primary" />
            </div>
        </div>
    );
};

export default Hero;
