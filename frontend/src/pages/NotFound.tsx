import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import PageTransition from "@/components/PageTransition";

const NotFound: React.FC = () => {
    const location = useLocation();

    React.useEffect(() => {
        console.error(
            "404 Error: 존재하지 않는 경로에 접근 시도함:",
            location.pathname
        );
    }, [location.pathname]);

    return (
        <PageTransition>
            <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
                {/* 404 이미지 */}
                <img
                    src="/content/image/404.png"
                    alt="페이지를 찾을 수 없습니다"
                    className="w-full max-w-md mx-auto mb-8 drop-shadow-lg"
                />

                <h1 className="text-3xl font-bold mb-4">
                    페이지를 찾을 수 없습니다
                </h1>

                <p className="text-muted-foreground mb-8">
                    요청하신 페이지가 존재하지 않거나, 이동되었거나 삭제된 것
                    같아요.
                </p>

                <Link to="/">
                    <Button className="gap-2">
                        <Home className="h-4 w-4" />
                        홈으로 돌아가기
                    </Button>
                </Link>
            </div>
        </PageTransition>
    );
};

export default NotFound;
