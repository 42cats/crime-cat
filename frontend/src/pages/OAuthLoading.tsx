import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginLoading from "@/components/LoginLoading";

const OAuthLoading = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const provider = params.get("provider");

        const errorProcess = () => {
            alert("로그인 처리 중 오류가 발생했습니다.");
            navigate("/login");
        };

        if (!code || !provider) {
            errorProcess();
            return;
        }

        const handleLogin = async () => {
            const url = `${
                import.meta.env.VITE_API_BASE_URL
            }/oauth2/${provider}?code=${code}`;

            try {
                const res = await fetch(url);
                const contentType = res.headers.get("content-type");

                if (!res.ok) {
                    const errorText = contentType?.includes("application/json")
                        ? JSON.stringify(await res.json())
                        : await res.text();
                    throw new Error(`서버 오류 (${res.status}): ${errorText}`);
                }

                const data = await res.json();
                // 로그인 처리 성공
                // localStorage.setItem('user', JSON.stringify(data.user));
                navigate("/");
            } catch (err) {
                console.error("Error : ", err);
                errorProcess();
            }
        };

        handleLogin();
    }, []);

    return <LoginLoading />;
};

export default OAuthLoading;
