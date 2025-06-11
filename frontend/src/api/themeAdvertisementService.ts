import { apiClient } from "@/lib/api";

// 타입 정의
export interface ThemeAdvertisementRequest {
    id: string;
    themeId: string;
    themeName: string;
    themeType: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD";
    requestedDays: number;
    remainingDays?: number;
    totalCost: number;
    requestedAt: string;
    startedAt?: string;
    expiresAt?: string;
    status: "PENDING_QUEUE" | "ACTIVE" | "CANCELLED" | "EXPIRED" | "REFUNDED";
    queuePosition?: number;
    clickCount: number;
    exposureCount: number;
    refundAmount?: number;
}

export interface QueueStatus {
    activeCount: number;
    maxActiveSlots: number;
    queuedCount: number;
    estimatedWaitTime: string;
}

export interface CreateAdvertisementRequest {
    themeId: string;
    themeName: string;
    themeType: "CRIMESCENE" | "ESCAPE_ROOM" | "MURDER_MYSTERY" | "REALWORLD";
    requestedDays: number;
}

export interface CreateAdvertisementResponse {
    success: boolean;
    message: string;
    requestId?: string;
    status?: string;
    queuePosition?: number;
}

export interface CancelAdvertisementResponse {
    success: boolean;
    message: string;
}

export interface RefundCalculationResponse {
    remainingDays: number;
    refundAmount: number;
    message: string;
}

// API 서비스 클래스
export class ThemeAdvertisementService {
    private readonly baseUrl = "/theme-ads";

    /**
     * 광고 신청
     */
    async requestAdvertisement(
        data: CreateAdvertisementRequest
    ): Promise<CreateAdvertisementResponse> {
        const response = await apiClient.post(`${this.baseUrl}/request`, data);
        return response;
    }

    /**
     * 내 광고 신청 목록 조회
     */
    async getMyRequests(): Promise<ThemeAdvertisementRequest[]> {
        const response = await apiClient.get(`${this.baseUrl}/my-requests`);
        return response;
    }

    /**
     * 큐 상태 조회
     */
    async getQueueStatus(): Promise<QueueStatus> {
        const response = await apiClient.get(`${this.baseUrl}/queue-status`);
        return response;
    }

    /**
     * 대기열 광고 취소
     */
    async cancelQueuedAdvertisement(
        requestId: string
    ): Promise<CancelAdvertisementResponse> {
        const response = await apiClient.delete(
            `${this.baseUrl}/request/${requestId}`
        );
        return response;
    }

    /**
     * 활성 광고 취소
     */
    async cancelActiveAdvertisement(
        requestId: string
    ): Promise<CancelAdvertisementResponse> {
        const response = await apiClient.delete(
            `${this.baseUrl}/active/${requestId}`
        );
        return response;
    }

    /**
     * 환불 금액 계산 (미리보기)
     */
    async calculateRefund(
        requestId: string
    ): Promise<RefundCalculationResponse> {
        const response = await apiClient.post(
            `${this.baseUrl}/calculate-refund`,
            { requestId }
        );
        return response;
    }

    /**
     * 클릭 기록
     */
    async recordClick(requestId: string): Promise<void> {
        await apiClient.post(`${this.baseUrl}/click/${requestId}`);
    }

    /**
     * 노출 기록
     */
    async recordExposure(requestId: string): Promise<void> {
        await apiClient.post(`${this.baseUrl}/exposure/${requestId}`);
    }
}

// 서비스 인스턴스 생성 및 내보내기
export const themeAdvertisementService = new ThemeAdvertisementService();

// 편의 함수들
export const useThemeAdvertisements = () => {
    return {
        requestAdvertisement:
            themeAdvertisementService.requestAdvertisement.bind(
                themeAdvertisementService
            ),
        getMyRequests: themeAdvertisementService.getMyRequests.bind(
            themeAdvertisementService
        ),
        getQueueStatus: themeAdvertisementService.getQueueStatus.bind(
            themeAdvertisementService
        ),
        cancelQueuedAdvertisement:
            themeAdvertisementService.cancelQueuedAdvertisement.bind(
                themeAdvertisementService
            ),
        cancelActiveAdvertisement:
            themeAdvertisementService.cancelActiveAdvertisement.bind(
                themeAdvertisementService
            ),
        calculateRefund: themeAdvertisementService.calculateRefund.bind(
            themeAdvertisementService
        ),
        recordClick: themeAdvertisementService.recordClick.bind(
            themeAdvertisementService
        ),
        recordExposure: themeAdvertisementService.recordExposure.bind(
            themeAdvertisementService
        ),
    };
};
