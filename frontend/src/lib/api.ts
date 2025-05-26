import axios from "axios";
import { resetUserState } from "@/utils/authUtils";
import { PointHistory, PointSummary, PageResponse } from "@/types/pointHistory";

const API_BASE_URL = "/api/v1";
const API_TIMEOUT = 30000;

const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
        Accept: "application/json",
    },
    withCredentials: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
});

let isRefreshingToken = false;
let isRefreshingCsrf = false;

const failedAuthQueue: {
    resolve: () => void;
    reject: (reason?: any) => void;
}[] = [];

const failedCsrfQueue: {
    resolve: () => void;
    reject: (reason?: any) => void;
}[] = [];

const processQueue = (queue: typeof failedAuthQueue, error: any = null) => {
    queue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve();
    });
    queue.length = 0;
};

instance.interceptors.request.use(async (config) => {
    const xsrfToken = getCookie("XSRF-TOKEN");

    if (!xsrfToken && !config.url?.includes("/csrf/token")) {
        if (isRefreshingCsrf) {
            return new Promise((resolve, reject) => {
                failedCsrfQueue.push({
                    resolve: () => resolve(config),
                    reject,
                });
            });
        }

        isRefreshingCsrf = true;

        try {
            await instance.get("/csrf/token");
            processQueue(failedCsrfQueue);
            return config;
        } catch (err) {
            processQueue(failedCsrfQueue, err);
        } finally {
            isRefreshingCsrf = false;
        }
    }

    return config;
});

// 재시도 횟수 추적을 위한 Map
const retryCountMap = new Map<string, number>();
const MAX_RETRY_COUNT = 2;

// 5분마다 재시도 카운트 클리어
setInterval(() => {
    retryCountMap.clear();
    console.log("재시도 카운트 맵 클리어");
}, 5 * 60 * 1000);

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestKey = `${originalRequest.method}:${originalRequest.url}`;

        // 특정 URL들은 재시도하지 않음
        if (originalRequest.url?.includes("/auth/reissue")) {
            return Promise.reject(error);
        }

        // /auth/me에 대한 401은 즉시 반환 (재시도 안함)
        if (originalRequest.url?.includes("/auth/me") && error.response?.status === 401) {
            console.log("/auth/me 401 에러 - 재시도하지 않고 즉시 반환");
            return Promise.reject(error);
        }

        const status = error.response?.status;

        if (
            status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/public/")
        ) {
            // 재시도 횟수 확인
            const currentRetryCount = retryCountMap.get(requestKey) || 0;
            
            if (currentRetryCount >= MAX_RETRY_COUNT) {
                console.log(`재시도 횟수 초과: ${requestKey}`);
                retryCountMap.delete(requestKey);
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            retryCountMap.set(requestKey, currentRetryCount + 1);

            if (isRefreshingToken) {
                return new Promise((resolve, reject) => {
                    failedAuthQueue.push({
                        resolve: () => resolve(instance(originalRequest)),
                        reject,
                    });
                });
            }

            isRefreshingToken = true;

            try {
                await instance.post("/auth/reissue");
                processQueue(failedAuthQueue);
                // 성공 시 재시도 카운트 리셋
                retryCountMap.delete(requestKey);
                return instance(originalRequest);
            } catch (err) {
                processQueue(failedAuthQueue, err);
                retryCountMap.clear(); // 모든 재시도 카운트 클리어
                resetUserState();
                window.location.href = "/login";
                return Promise.reject(err);
            } finally {
                isRefreshingToken = false;
            }
        }

        if (status === 403 && !originalRequest._csrfRetry) {
            const errorCode = error.response?.data?.errorCode;

            if (errorCode === "INSUFFICIENT_AUTHENTICATION") {
              originalRequest._csrfRetry = true;

              try {
                  await instance.get("/csrf/token");
                  return instance(originalRequest);
              } catch (err) {
                  return Promise.reject(err);
              }
            }
        }

        return Promise.reject(error);
    }
);

function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
}

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

// Point History API
export const pointHistoryApi = {
    // 포인트 내역 조회 (with pagination and filtering)
    getPointHistory: (params?: {
        page?: number;
        size?: number;
        type?: string;
        sort?: string[];
    }): Promise<PageResponse<PointHistory>> => {
        const searchParams = new URLSearchParams();
        if (params) {
            if (params.page !== undefined)
                searchParams.append("page", params.page.toString());
            if (params.size !== undefined)
                searchParams.append("size", params.size.toString());
            if (params.type) searchParams.append("type", params.type);
            if (params.sort && params.sort.length > 0) {
                params.sort.forEach((sortOption) => {
                    searchParams.append("sort", sortOption);
                });
            }
        }
        const query = searchParams.toString();
        return apiClient.get(`/point-history${query ? "?" + query : ""}`);
    },

    // 포인트 내역 요약 정보 조회
    getPointSummary: (): Promise<PointSummary> =>
        apiClient.get<PointSummary>("/point-history/summary"),
};
