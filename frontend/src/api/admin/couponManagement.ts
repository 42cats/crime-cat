import { apiClient } from "@/lib/api";

// 쿠폰 관리 API
export const couponManagementApi = {
    // 쿠폰 목록 조회
    getCoupons: (params?: {
        page?: number;
        size?: number;
        code?: string;
        status?: string;
        sort?: string[];
    }) => {
        const searchParams = new URLSearchParams();
        if (params) {
            if (params.page !== undefined)
                searchParams.append("page", params.page.toString());
            if (params.size !== undefined)
                searchParams.append("size", params.size.toString());
            if (params.code)
                searchParams.append("code", params.code);
            if (params.status)
                searchParams.append("status", params.status);
            if (params.sort && params.sort.length > 0) {
                params.sort.forEach((sortOption) => {
                    searchParams.append("sort", sortOption);
                });
            }
        }
        const query = searchParams.toString();
        return apiClient.get(`/admin/coupons${query ? "?" + query : ""}`);
    },

    // 쿠폰 목록 조회 (별칭)
    getAllCoupons: (params?: {
        page?: number;
        size?: number;
        status?: string;
        sort?: string[];
    }) => {
        const searchParams = new URLSearchParams();
        if (params) {
            if (params.page !== undefined)
                searchParams.append("page", params.page.toString());
            if (params.size !== undefined)
                searchParams.append("size", params.size.toString());
            if (params.status)
                searchParams.append("status", params.status);
            if (params.sort && params.sort.length > 0) {
                params.sort.forEach((sortOption) => {
                    searchParams.append("sort", sortOption);
                });
            }
        }
        const query = searchParams.toString();
        return apiClient.get(`/admin/coupons${query ? "?" + query : ""}`);
    },

    // 쿠폰 생성
    createCoupon: (request: { value: number; duration: number; count: number }) => {
        return apiClient.post("/admin/coupons", request);
    },

    // 쿠폰 생성 (기존 함수명 유지)
    createCoupons: (value: number, count: number, duration: number) => {
        return apiClient.post("/admin/coupons", {
            value,
            count,
            duration,
        });
    },

    // 쿠폰 통계 조회
    getCouponStats: () => {
        return apiClient.get("/admin/coupons/stats");
    },

    // 쿠폰 삭제
    deleteCoupon: (couponId: string) => {
        return apiClient.delete(`/admin/coupons/${couponId}`);
    },
};