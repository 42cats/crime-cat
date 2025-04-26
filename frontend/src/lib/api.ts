import axios from 'axios';
import { resetUserState } from "@/utils/authUtils";

const API_BASE_URL = "/api/v1";
const API_TIMEOUT = 30000;

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Accept': 'application/json',
  },
  withCredentials: true
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

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        await instance.post('/auth/reissue');

        processQueue();
        return instance(originalRequest);
      } catch (err) {
        processQueue(err);
        resetUserState();
        window.location.href = '/login';
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