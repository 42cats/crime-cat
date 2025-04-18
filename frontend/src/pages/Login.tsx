import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { LoaderCircle, User, Key } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
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

const Login: React.FC = () => {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const oauthBaseUri = `/oauth2/authorization`;

    const loginWithDiscord = () => {
        window.location.href = oauthBaseUri + "/discord";
    };

    const from = location.state?.from?.pathname || "/dashboard";

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);

        try {
            await login(username, password);
        } catch (error: any) {
            console.error("로그인 오류:", error);
            toast({
                title: "로그인 실패",
                description: error.message || "인증에 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen flex items-center justify-center px-6 py-20">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">
                            로그인
                        </CardTitle>
                        <CardDescription>
                            대시보드에 접속하려면 사용자 이름과 비밀번호를
                            입력하세요.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">사용자 이름</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Username"
                                        className="pl-10"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">비밀번호</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Password"
                                        className="pl-10"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? (
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                ) : (
                                    "로그인"
                                )}
                            </Button>
                        </form>

                        <div className="mt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                className="w-full flex items-center justify-center gap-2"
                                onClick={loginWithDiscord}
                            >
                                <FaDiscord className="h-4 w-4" />
                                Discord로 로그인
                            </Button>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-center">
                        <p className="text-xs text-center text-muted-foreground">
                            로그인함으로써 이용 약관 및 개인정보 처리방침에
                            동의하게 됩니다.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </PageTransition>
    );
};

export default Login;
