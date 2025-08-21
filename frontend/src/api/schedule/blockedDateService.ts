import { apiClient } from '@/lib/api';

/**
 * 날짜 비활성화 관리 API 서비스
 * 비트맵 기반 최적화된 날짜 관리 시스템과 연동
 */
export class BlockedDateService {
  private readonly baseURL = '/schedule/my-calendar';

  /**
   * 특정 날짜 비활성화 (추천에서 제외)
   * @param date ISO 날짜 문자열 (YYYY-MM-DD)
   */
  async blockDate(date: string): Promise<{ message: string; date: string }> {
    const params = new URLSearchParams({ date });
    return await apiClient.post<{ message: string; date: string }>(
      `${this.baseURL}/block-date?${params.toString()}`
    );
  }

  /**
   * 특정 날짜 활성화 (추천에 포함)
   * @param date ISO 날짜 문자열 (YYYY-MM-DD)
   */
  async unblockDate(date: string): Promise<{ message: string; date: string }> {
    const params = new URLSearchParams({ date });
    return await apiClient.delete<{ message: string; date: string }>(
      `${this.baseURL}/block-date?${params.toString()}`
    );
  }

  /**
   * 날짜 범위 일괄 비활성화 (드래그 선택)
   * @param startDate 시작 날짜 (YYYY-MM-DD)
   * @param endDate 종료 날짜 (YYYY-MM-DD)
   */
  async blockDateRange(
    startDate: string,
    endDate: string
  ): Promise<{ message: string; startDate: string; endDate: string }> {
    const params = new URLSearchParams({ startDate, endDate });
    return await apiClient.post<{ message: string; startDate: string; endDate: string }>(
      `${this.baseURL}/block-range?${params.toString()}`
    );
  }

  /**
   * 비활성화된 날짜 목록 조회
   * @param startDate 조회 시작 날짜 (YYYY-MM-DD)
   * @param endDate 조회 종료 날짜 (YYYY-MM-DD)
   */
  async getBlockedDates(startDate: string, endDate: string): Promise<string[]> {
    const params = new URLSearchParams({ startDate, endDate });
    return await apiClient.get<string[]>(`${this.baseURL}/blocked-dates?${params.toString()}`);
  }

  /**
   * 사용자 iCalendar 이벤트 조회 (특정 기간)
   * 백엔드에서 iCalendar를 파싱하여 반환하는 API 호출
   * @param startDate 조회 시작 날짜 (YYYY-MM-DD)
   * @param endDate 조회 종료 날짜 (YYYY-MM-DD)
   */
  async getUserEventsInRange(
    startDate: string,
    endDate: string
  ): Promise<Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    allDay: boolean;
  }>> {
    const params = new URLSearchParams({ startDate, endDate });
    return await apiClient.get<Array<{
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      allDay: boolean;
    }>>(`${this.baseURL}/events-in-range?${params.toString()}`);
  }

  /**
   * 현재 월의 날짜 통계 조회
   * @param year 연도
   * @param month 월 (1-12)
   */
  async getMonthlyStats(year: number, month: number): Promise<{
    totalDays: number;
    availableDays: number;
    blockedDays: number;
    busyDays: number;
    availabilityRate: number;
  }> {
    const params = new URLSearchParams({ 
      year: year.toString(), 
      month: month.toString() 
    });
    return await apiClient.get<{
      totalDays: number;
      availableDays: number;
      blockedDays: number;
      busyDays: number;
      availabilityRate: number;
    }>(`${this.baseURL}/monthly-stats?${params.toString()}`);
  }

  /**
   * 비활성화 설정 전체 초기화
   * 모든 비활성화된 날짜를 활성화 상태로 되돌림
   */
  async resetAllBlockedDates(): Promise<{ message: string; resetCount: number }> {
    return await apiClient.delete<{ message: string; resetCount: number }>(
      `${this.baseURL}/reset-all`
    );
  }

  /**
   * 특정 기간의 모든 날짜 비활성화
   * @param startDate 시작 날짜 (YYYY-MM-DD)
   * @param endDate 종료 날짜 (YYYY-MM-DD)
   */
  async blockAllInRange(
    startDate: string,
    endDate: string
  ): Promise<{ message: string; blockedCount: number }> {
    const params = new URLSearchParams({ startDate, endDate });
    return await apiClient.post<{ message: string; blockedCount: number }>(
      `${this.baseURL}/block-all-range?${params.toString()}`
    );
  }

  /**
   * 특정 기간의 모든 날짜 활성화
   * @param startDate 시작 날짜 (YYYY-MM-DD)
   * @param endDate 종료 날짜 (YYYY-MM-DD)
   */
  async unblockAllInRange(
    startDate: string,
    endDate: string
  ): Promise<{ message: string; unblockedCount: number }> {
    const params = new URLSearchParams({ startDate, endDate });
    return await apiClient.delete<{ message: string; unblockedCount: number }>(
      `${this.baseURL}/unblock-all-range?${params.toString()}`
    );
  }
}

// 싱글톤 인스턴스 생성
export const blockedDateService = new BlockedDateService();