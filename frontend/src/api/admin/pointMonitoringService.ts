import { apiClient } from "@/lib/api";
import { 
    PointHistory, 
    PageResponse, 
    TransactionType 
} from "@/types/pointHistory";

// 관리자용 타입 정의
export interface PointHistoryFilterParams {
    page?: number;
    size?: number;
    type?: TransactionType;
    userId?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    sort?: string[];
}

export interface SuspiciousActivity {
    userId: string;
    userNickname: string;
    userEmail: string;
    suspiciousType: 'RAPID_EARNING' | 'LARGE_AMOUNT' | 'REPEATED_TRANSFER';
    description: string;
    detectedAt: string;
    totalAmount: number;
    transactionCount: number;
    recentTransactions: TransactionDetail[];
}

export interface TransactionDetail {
    transactionId: string;
    type: TransactionType;
    amount: number;
    usedAt: string;
    memo: string;
    relatedUserNickname?: string;
}

export interface UserPointSummary {
    userId: string;
    nickname: string;
    email: string;
    profileImagePath: string;
    currentBalance: number;
    totalEarned: number;
    totalSpent: number;
    totalReceived: number;
    totalGifted: number;
    lastTransactionAt: string | null;
    accountCreatedAt: string;
}

export interface PointStatistics {
    startDate: string;
    endDate: string;
    totalTransactions: number;
    totalPointsCirculated: number;
    transactionsByType: Record<TransactionType, number>;
    amountByType: Record<TransactionType, number>;
    hourlyDistribution: Record<number, number>;
    uniqueUsers: number;
    averageTransactionAmount: number;
    maxTransactionAmount: number;
    minTransactionAmount: number;
}

// 관리자용 포인트 내역 응답 타입 확장
export interface AdminPointHistory extends PointHistory {
    userNickname: string;
    userId: string;
}

const baseURI = "/admin/point-history";

export const adminPointMonitoringService = {
    // 전체 포인트 내역 조회
    getAllPointHistory: async (params: PointHistoryFilterParams): Promise<PageResponse<AdminPointHistory>> => {
        try {
            const searchParams = new URLSearchParams();
            
            if (params.page !== undefined) searchParams.append("page", params.page.toString());
            if (params.size !== undefined) searchParams.append("size", params.size.toString());
            if (params.type) searchParams.append("type", params.type);
            if (params.userId) searchParams.append("userId", params.userId);
            if (params.startDate) searchParams.append("startDate", params.startDate);
            if (params.endDate) searchParams.append("endDate", params.endDate);
            if (params.minAmount !== undefined) searchParams.append("minAmount", params.minAmount.toString());
            if (params.maxAmount !== undefined) searchParams.append("maxAmount", params.maxAmount.toString());
            if (params.sort) {
                params.sort.forEach(s => searchParams.append("sort", s));
            }
            
            const query = searchParams.toString();
            return await apiClient.get<PageResponse<AdminPointHistory>>(
                `${baseURI}${query ? "?" + query : ""}`
            );
        } catch (error) {
            console.error("전체 포인트 내역 조회 실패:", error);
            throw error;
        }
    },

    // 의심스러운 활동 조회
    getSuspiciousActivities: async (hours: number = 24): Promise<SuspiciousActivity[]> => {
        try {
            return await apiClient.get<SuspiciousActivity[]>(
                `${baseURI}/suspicious?hours=${hours}`
            );
        } catch (error) {
            console.error("의심스러운 활동 조회 실패:", error);
            throw error;
        }
    },

    // 특정 사용자 포인트 내역 조회
    getUserPointHistory: async (
        userId: string, 
        params?: {
            page?: number;
            size?: number;
            type?: TransactionType;
            startDate?: string;
            endDate?: string;
        }
    ): Promise<PageResponse<AdminPointHistory>> => {
        try {
            const searchParams = new URLSearchParams();
            
            if (params) {
                if (params.page !== undefined) searchParams.append("page", params.page.toString());
                if (params.size !== undefined) searchParams.append("size", params.size.toString());
                if (params.type) searchParams.append("type", params.type);
                if (params.startDate) searchParams.append("startDate", params.startDate);
                if (params.endDate) searchParams.append("endDate", params.endDate);
            }
            
            const query = searchParams.toString();
            return await apiClient.get<PageResponse<AdminPointHistory>>(
                `${baseURI}/user/${userId}${query ? "?" + query : ""}`
            );
        } catch (error) {
            console.error("사용자 포인트 내역 조회 실패:", error);
            throw error;
        }
    },

    // 특정 사용자 포인트 요약 정보 조회
    getUserPointSummary: async (userId: string): Promise<UserPointSummary> => {
        try {
            return await apiClient.get<UserPointSummary>(
                `${baseURI}/user/${userId}/summary`
            );
        } catch (error) {
            console.error("사용자 포인트 요약 정보 조회 실패:", error);
            throw error;
        }
    },

    // 포인트 통계 조회
    getPointStatistics: async (startDate?: string, endDate?: string): Promise<PointStatistics> => {
        try {
            const searchParams = new URLSearchParams();
            if (startDate) searchParams.append("startDate", startDate);
            if (endDate) searchParams.append("endDate", endDate);
            
            const query = searchParams.toString();
            return await apiClient.get<PointStatistics>(
                `${baseURI}/statistics${query ? "?" + query : ""}`
            );
        } catch (error) {
            console.error("포인트 통계 조회 실패:", error);
            throw error;
        }
    },

    // 포인트 상위 보유자 조회
    getTopPointHolders: async (limit: number = 10): Promise<UserPointSummary[]> => {
        try {
            return await apiClient.get<UserPointSummary[]>(
                `${baseURI}/top-holders?limit=${limit}`
            );
        } catch (error) {
            console.error("포인트 상위 보유자 조회 실패:", error);
            throw error;
        }
    }
};
