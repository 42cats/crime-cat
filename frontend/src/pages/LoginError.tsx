import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Clock, Shield } from "lucide-react";
import BlockedUserModal from "@/components/auth/BlockedUserModal";
import { BlockInfo } from "@/types/user";
import { OptimizedImage } from "@/components/ui/optimized-image";

const LoginError: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const errorType = searchParams.get("type");
    const blockInfoParam = searchParams.get("blockInfo");
    
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);
    
    useEffect(() => {
        if (errorType === "account_blocked" && blockInfoParam) {
            try {
                const parsedBlockInfo = JSON.parse(decodeURIComponent(blockInfoParam));
                setBlockInfo({
                    isBlocked: true,
                    blockReason: parsedBlockInfo.reason || "사유를 알 수 없습니다.",
                    blockedAt: parsedBlockInfo.blockedAt || undefined,
                    blockExpiresAt: parsedBlockInfo.blockExpiresAt || undefined,
                    isPermanent: parsedBlockInfo.isPermanent || false,
                });
                setShowBlockModal(true);
            } catch (error) {
                console.error("차단 정보 파싱 오류:", error);
            }
        }
    }, [errorType, blockInfoParam]);

    const getErrorContent = () => {
        switch (errorType) {
            case "account_not_found":
                return {
                    title: "계정을 찾을 수 없습니다",
                    description:
                        "디스코드 계정으로 가입된 사용자가 없습니다. 회원가입을 먼저 진행해주세요.",
                    action: "회원가입으로 이동",
                    actionHandler: () => navigate("/login"),
                };
            case "already_registered":
                return {
                    title: "이미 가입된 계정",
                    description:
                        "이미 가입된 디스코드 계정입니다. 로그인을 진행해주세요.",
                    action: "로그인으로 이동",
                    actionHandler: () => navigate("/login"),
                };
            case "access_denied":
                return {
                    title: "접근 권한 없음",
                    description:
                        "디스코드 계정 접근이 거부되었습니다. 계정 권한을 확인해주세요.",
                    action: "다시 시도하기",
                    actionHandler: () => navigate("/login"),
                };
            case "account_blocked":
                return {
                    title: "계정이 차단되었습니다",
                    description: blockInfo ? 
                        `차단 사유: ${blockInfo.blockReason}` :
                        "귀하의 계정이 관리자에 의해 차단되었습니다. 자세한 사항은 관리자에게 문의해주세요.",
                    action: blockInfo ? "차단 정보 확인" : "홈으로 돌아가기",
                    actionHandler: blockInfo ? () => setShowBlockModal(true) : () => navigate("/"),
                };
            default:
                return {
                    title: "로그인 오류",
                    description:
                        "로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
                    action: "로그인으로 돌아가기",
                    actionHandler: () => navigate("/login"),
                };
        }
    };

    const { title, description, action, actionHandler } = getErrorContent();

    return (
        <PageTransition>
            <div className="min-h-screen flex items-center justify-center px-6 py-20">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 flex flex-col items-center">
                        {/* ✅ 이미지 추가 */}
                        <OptimizedImage
                            src="/content/image/LoginError.png"
                            alt="에러 고양이 이미지"
                            priority={true}
                            className="w-50 h-70 mb-4"
                        />
                        <CardTitle className="text-2xl font-bold text-center">
                            {title}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4">
                        <Button
                            variant="default"
                            className="w-full"
                            onClick={actionHandler}
                        >
                            {action}
                        </Button>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <p className="text-xs text-center text-muted-foreground">
                            문제가 계속되면 관리자에게 문의해주세요.
                        </p>
                    </CardFooter>
                </Card>
            </div>
            
            {blockInfo && (
                <BlockedUserModal
                    isOpen={showBlockModal}
                    blockInfo={blockInfo}
                    onClose={() => {
                        setShowBlockModal(false);
                        navigate("/");
                    }}
                />
            )}
        </PageTransition>
    );
};

export default LoginError;
