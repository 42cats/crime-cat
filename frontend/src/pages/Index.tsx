import React from "react";
import Hero from "@/components/Hero";
import { motion } from "framer-motion";
import { Bot, Code, Gamepad, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PageTransition from "@/components/PageTransition";

const Index: React.FC = () => {
    const features = [
        {
            icon: <Code className="h-8 w-8 text-primary" />,
            title: "주소 기반 음악 재생",
            description:
                "유튜브 링크만 입력하면 바로 저장 및 재생되는 음악 관리 기능을 제공합니다.",
        },
        {
            icon: <Shield className="h-8 w-8 text-primary" />,
            title: "자동화된 서버 관리",
            description:
                "중복 체크, 제한 개수 관리, 에러 처리까지 자동으로 이루어집니다.",
        },
        {
            icon: <Gamepad className="h-8 w-8 text-primary" />,
            title: "게임 세션 보조 기능",
            description:
                "TRPG나 추리 게임에 맞춰 유저 참여 기록과 역할 관리도 간편하게!",
        },
        {
            icon: <Users className="h-8 w-8 text-primary" />,
            title: "명령어 & 권한 시스템",
            description:
                "버튼 + 슬래시 명령어 조합으로 누구나 손쉽게 봇 기능을 활용할 수 있습니다.",
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
        <PageTransition>
            {/* 히어로 섹션 */}
            <Hero />

            {/* 기능 섹션 */}
            <section id="features" className="py-20 px-6">
                <div className="container mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-12">
                        짭냥이 주요 기능
                    </h2>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto"
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="p-6 rounded-lg glass card-hover"
                                variants={item}
                            >
                                <div className="flex justify-center mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA 섹션 */}
            <section className="py-20 relative overflow-hidden">
                {/* 배경 요소 */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-300/5 rounded-full filter blur-3xl" />
                </div>

                <div className="container mx-auto px-6 text-center">
                    <div className="max-w-3xl mx-auto glass rounded-xl p-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                            <Bot className="h-8 w-8 text-primary" />
                        </div>

                        <h2 className="text-3xl font-bold mb-4">
                            지금 짭냥이를 만나보세요!
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
                            디스코드 서버에 특화된 음악 + 게임 + 커뮤니티 기능을
                            한 번에. 지금 봇을 추가하고 직접 체험해보세요!
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <a
                                href="https://discord.com/oauth2/authorize?client_id=1069990761778659458"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto"
                            >
                                <Button size="lg" className="w-full">
                                    디스코드에 추가하기
                                </Button>
                            </a>

                            <Link to="/commands" className="w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full"
                                >
                                    명령어 보기
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </PageTransition>
    );
};

export default Index;
