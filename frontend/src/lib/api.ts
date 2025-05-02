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
        // XSRF-TOKEN 쿠키에서 토큰 추출
        const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("XSRF-TOKEN="))
            ?.split("=")[1];

        if (token) {
            // 스프링 기본 헤더 이름은 'X-XSRF-TOKEN'
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
            error.response?.data?.message?.includes("CSRF")
        ) {
            // CSRF 토큰을 재요청하고 원래 요청 재시도
            try {
                // CSRF 토큰 재요청 엔드포인트 호출
                await instance.get("/csrf/token");
                return instance(originalRequest);
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
                window.location.href = "/login";
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
