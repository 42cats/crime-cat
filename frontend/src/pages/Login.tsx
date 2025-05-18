import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FaDiscord } from "react-icons/fa";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

const Login: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // 약관 동의 모달 상태
    const [termsModalOpen, setTermsModalOpen] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);

    // 에러 알림 모달 상태
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // 디스코드 OAuth 경로
    const loginWithDiscord = (mode) => {
        setIsLoggingIn(true);
        window.location.href = `/oauth2/authorization/discord-${mode}`;
    };

    // 로그인 버튼 클릭 핸들러
    const handleLogin = () => {
        loginWithDiscord("login");
    };

    // 회원가입 버튼 클릭 핸들러
    const handleSignup = () => {
        // 약관 동의 모달 표시
        setTermsModalOpen(true);
    };

    // 약관 동의 후 회원가입 진행
    const handleAgreeTerms = () => {
        setTermsModalOpen(false);
        loginWithDiscord("signup");
    };

    // OAuth 인증 후 에러 응답 처리 함수
    const handleOAuthError = (error) => {
        setErrorMessage(error.message || "인증 중 오류가 발생했습니다.");
        setErrorDialogOpen(true);
        setIsLoggingIn(false);
    };

    // 에러 모달 닫기 핸들러
    const closeErrorDialog = () => {
        setErrorDialogOpen(false);
    };

    const from = location.state?.from?.pathname || "/dashboard";

    useEffect(() => {
        // 인증된 경우 리다이렉트
        if (isAuthenticated) {
            navigate(from, { replace: true });
            return;
        }

        // OAuth 에러 처리
        const checkOAuthError = async () => {
            try {
                const response = await fetch("/api/v1/auth/oauth2/error", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (response.status >= 400) {
                    const errorData = await response.json();
                    if (errorData.error) {
                        handleOAuthError(errorData);
                    }
                }
            } catch (error) {
                // API 호출 자체가 실패한 경우는 무시 (OAuth 에러가 아닌 경우)
                console.log("No OAuth error response");
            } finally {
                setIsLoggingIn(false);
            }
        };

        checkOAuthError();
    }, [isAuthenticated, navigate, from]);

    return (
        <PageTransition>
            <div className="min-h-screen flex items-center justify-center px-6 py-20">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 flex flex-col items-center">
                        <div className="w-32 h-32 mb-4 flex items-center justify-center">
                            <img
                                src="/content/image/logo_dark.png"
                                alt="Crime Cat Logo"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            Crime Cat
                        </CardTitle>
                        <CardDescription>
                            Discord로 로그인하거나 회원가입하여 서비스를
                            이용하세요.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* 로그인 버튼 */}
                        <Button
                            type="button"
                            variant="default"
                            className="w-full flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752c4]"
                            onClick={handleLogin}
                            disabled={isLoggingIn}
                        >
                            <FaDiscord className="h-5 w-5" />
                            {isLoggingIn ? (
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : (
                                "Discord로 로그인"
                            )}
                        </Button>

                        {/* 회원가입 버튼 */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white"
                            onClick={handleSignup}
                            disabled={isLoggingIn}
                        >
                            <FaDiscord className="h-5 w-5" />
                            Discord로 회원가입
                        </Button>
                    </CardContent>

                    <CardFooter className="flex justify-center">
                        <p className="text-xs text-center text-muted-foreground">
                            로그인함으로써 이용 약관 및 개인정보 처리방침에
                            동의하게 됩니다.
                        </p>
                    </CardFooter>
                </Card>

                {/* 약관 동의 모달 */}
                <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>서비스 이용약관 동의</DialogTitle>
                            <DialogDescription>
                                Crime Cat 서비스를 이용하기 위해 다음 약관에
                                동의해주세요.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 my-4">
                            {/* 이용약관 */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    이용약관
                                </Label>
                                <div className="border rounded-md p-3 h-[200px] overflow-y-auto text-xs">
                                    {/* 이용약관 내용 */}
                                    <h2 className="text-base font-semibold mb-2">
                                        이용약관
                                    </h2>
                                    <p className="text-muted-foreground mb-2">
                                        최종 수정일: 2025-04-27
                                    </p>

                                    <section className="mb-4">
                                        <h3 className="text-sm font-semibold mb-1">
                                            1. 수집하는 정보
                                        </h3>
                                        <p>
                                            디스코드 사용자와 웹사이트 이용자의
                                            정보를 다음과 같이 수집합니다:
                                        </p>
                                        <ul className="list-disc list-inside mt-1 text-xs">
                                            <li>
                                                디스코드 사용자: ID(snowflake),
                                                이름, 프로필 이미지, 알림 설정
                                                여부, 포인트 등
                                            </li>
                                            <li>
                                                웹 사용자: 이메일, 암호화된
                                                비밀번호, 닉네임, 역할, 로그인
                                                시각 등
                                            </li>
                                            <li>
                                                길드 정보: 서버 ID, 이름, 소유자
                                                ID 등
                                            </li>
                                        </ul>
                                    </section>

                                    <section className="mb-4">
                                        <h3 className="text-sm font-semibold mb-1">
                                            2. 수집 목적
                                        </h3>
                                        <ul className="list-disc list-inside text-xs">
                                            <li>
                                                디스코드 봇 서비스 제공 및
                                                개인화
                                            </li>
                                            <li>
                                                웹사이트 기능 제공 (로그인,
                                                대시보드 등)
                                            </li>
                                            <li>
                                                게임 기록, 음악 관리, 쿠폰 발행
                                                등 커뮤니티 서비스 제공
                                            </li>
                                            <li>
                                                통계 및 서비스 개선 목적의 분석
                                            </li>
                                        </ul>
                                    </section>

                                    <section className="mb-4">
                                        <h3 className="text-sm font-semibold mb-1">
                                            3. 보관 및 보호
                                        </h3>
                                        <ul className="list-disc list-inside text-xs">
                                            <li>
                                                비밀번호는 해시 처리되어
                                                저장되며 복호화되지 않습니다.
                                            </li>
                                            <li>
                                                UUID 기반 고유 식별자로 사용자
                                                식별 및 보안 강화
                                            </li>
                                            <li>
                                                사용자가 계정을 비활성화하거나
                                                탈퇴하면 관련 정보는 삭제되거나
                                                비활성화 처리됩니다.
                                            </li>
                                        </ul>
                                    </section>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="terms"
                                        checked={termsChecked}
                                        onCheckedChange={(checked) =>
                                            setTermsChecked(checked === true)
                                        }
                                    />
                                    <label
                                        htmlFor="terms"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        이용약관에 동의합니다
                                    </label>
                                </div>
                            </div>

                            {/* 개인정보 처리방침 */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    개인정보 처리방침
                                </Label>
                                <div className="border rounded-md p-3 h-[200px] overflow-y-auto text-xs">
                                    {/* 개인정보 처리방침 내용 */}
                                    <h2 className="text-base font-semibold mb-2">
                                        개인정보 처리방침
                                    </h2>
                                    <p className="text-muted-foreground mb-2">
                                        최종 수정일: 2025-04-27
                                    </p>

                                    <section className="mb-4">
                                        <h3 className="text-sm font-semibold mb-1">
                                            1. 수집하는 개인정보 항목
                                        </h3>
                                        <ul className="list-disc list-inside text-xs">
                                            <li>디스코드 고유 식별자(ID)</li>
                                            <li>사용자명 및 태그</li>
                                            <li>프로필 사진 URL</li>
                                            <li>이메일(선택적 수집)</li>
                                            <li>
                                                가입일, 마지막 로그인 시각,
                                                포인트 및 활동 기록
                                            </li>
                                        </ul>
                                    </section>

                                    <section className="mb-4">
                                        <h3 className="text-sm font-semibold mb-1">
                                            2. 개인정보 수집 방법
                                        </h3>
                                        <p className="text-xs">
                                            디스코드 OAuth 인증을 통한 자동 수집
                                            및 서비스 이용 중 생성되는 기록을
                                            통해 수집합니다.
                                        </p>
                                    </section>

                                    <section className="mb-4">
                                        <h3 className="text-sm font-semibold mb-1">
                                            3. 개인정보 이용 목적
                                        </h3>
                                        <ul className="list-disc list-inside text-xs">
                                            <li>서비스 제공 및 본인 인증</li>
                                            <li>포인트 및 권한 관리</li>
                                            <li>
                                                서비스 개선 및 신규 기능 개발
                                            </li>
                                            <li>법적 의무 준수 및 민원 처리</li>
                                        </ul>
                                    </section>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="privacy"
                                        checked={privacyChecked}
                                        onCheckedChange={(checked) =>
                                            setPrivacyChecked(checked === true)
                                        }
                                    />
                                    <label
                                        htmlFor="privacy"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        개인정보 처리방침에 동의합니다
                                    </label>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setTermsModalOpen(false)}
                                className="mr-2"
                            >
                                취소
                            </Button>
                            <Button
                                onClick={handleAgreeTerms}
                                disabled={!termsChecked || !privacyChecked}
                            >
                                동의하고 계속하기
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 에러 모달 */}
                <AlertDialog
                    open={errorDialogOpen}
                    onOpenChange={setErrorDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>인증 오류</AlertDialogTitle>
                            <AlertDialogDescription>
                                {errorMessage}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={closeErrorDialog}>
                                확인
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PageTransition>
    );
};

export default Login;
