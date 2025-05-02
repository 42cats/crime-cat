import axios from "axios";
import { resetUserState } from "@/utils/authUtils";

const API_BASE_URL = "/api/v1";
const API_TIMEOUT = 30000;

const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
        Accept: "application/json",
    },
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: {
    resolve: () => void;
    reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve();
    });
    failedQueue = [];
};

// CSRF 토큰 처리를 위한 요청 인터셉터 추가
instance.interceptors.request.use(
    (config) => {
        // 1) sessionStorage에서 우선 읽기
        let token = sessionStorage.getItem("csrfToken");

        // 2) sessionStorage에 없으면, 쿠키에서 추출
        if (!token) {
            token =
                document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("XSRF-TOKEN="))
                    ?.split("=")[1] ?? "";

            // 3) 쿠키에서 읽어왔으면 sessionStorage에 저장
            if (token) {
                sessionStorage.setItem("csrfToken", token);
            }
        }

        // 4) 토큰이 있으면 헤더에 붙이기
        if (token) {
            config.headers["X-XSRF-TOKEN"] = token;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (originalRequest.url?.includes("/auth/reissue")) {
            return Promise.reject(error);
        }

        // CSRF 토큰 오류 처리 (403 Forbidden)
        if (
            error.response?.status === 403 &&
            (error.response?.data?.message?.includes("CSRF") ||
                error.response?.data?.message?.includes(
                    "인증 정보가 부족합니다."
                ) ||
                error.response?.data?.error?.includes("CSRF") ||
                error.response?.data?.includes("CSRF") ||
                error.response?.statusText?.includes("Forbidden"))
        ) {
            console.warn("CSRF 토큰 오류 감지. 토큰 재요청 시도...");

            // 기존 토큰 제거
            sessionStorage.removeItem("csrfToken");

            // CSRF 토큰을 재요청하고 원래 요청 재시도
            try {
                // CSRF 토큰 재요청 엔드포인트 호출
                const response = await instance.get("/csrf/token");

                // 응답 헤더에서 토큰 확인
                const headerToken =
                    response.headers && response.headers["x-csrf-token"];

                // 쿠키에서 토큰 확인
                const cookieToken = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("XSRF-TOKEN="))
                    ?.split("=")[1];

                // 토큰 저장
                const tokenToUse = headerToken || cookieToken;

                if (tokenToUse) {
                    sessionStorage.setItem("csrfToken", tokenToUse);
                    console.log("토큰 재설정 완료. 원래 요청 재시도...");

                    // 원래 요청 헤더에 새 토큰 설정
                    originalRequest.headers["X-XSRF-TOKEN"] = tokenToUse;
                    return instance(originalRequest);
                } else {
                    console.error("CSRF 토큰 재설정 실패: 토큰이 없습니다.");
                }
            } catch (err) {
                console.error("CSRF 토큰 재설정 실패:", err);
            }
        }

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/auth/me")
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: () => resolve(instance(originalRequest)),
                        reject,
                    });
                });
            }

            isRefreshing = true;

            try {
                await instance.post("/auth/reissue");
                processQueue();
                return instance(originalRequest);
            } catch (err) {
                processQueue(err);
                resetUserState();
                // 메인 페이지에서만 로그인 페이지로 리다이렉트
                if (window.location.pathname !== "/") {
                    window.location.href = "/login";
                }
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const apiClient = {
    get: async <T>(endpoint: string, config = {}): Promise<T> => {
        const res = await instance.get<T>(endpoint, config);
        return res.data;
    },

    post: async <T>(endpoint: string, data?: any, config = {}): Promise<T> => {
        const res = await instance.post<T>(endpoint, data, config);
        return res.data;
    },

    put: async <T>(endpoint: string, data?: any, config = {}): Promise<T> => {
        const res = await instance.put<T>(endpoint, data, config);
        return res.data;
    },

    patch: async <T>(endpoint: string, data?: any, config = {}): Promise<T> => {
        const res = await instance.patch<T>(endpoint, data, config);
        return res.data;
    },

    delete: async <T>(endpoint: string, config = {}): Promise<T> => {
        const res = await instance.delete<T>(endpoint, config);
        return res.data;
    },
};
