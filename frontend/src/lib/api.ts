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

let failedAuthQueue: {
    resolve: () => void;
    reject: (reason?: any) => void;
}[] = [];

let failedCsrfQueue: {
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

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (originalRequest.url?.includes("/auth/reissue")) {
            return Promise.reject(error);
        }

        const status = error.response?.status;

        if (
            status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/auth/me")
        ) {
            originalRequest._retry = true;

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
                return instance(originalRequest);
            } catch (err) {
                processQueue(failedAuthQueue, err);
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
