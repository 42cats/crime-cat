package com.crimecat.backend.advertisement.util;

/**
 * 광고 노출 수 계산 유틸리티
 * 실제 API 호출 대신 단순 수학적 계산으로 예상 노출 수 산출
 */
public class ExposureCalculationUtil {

    /**
     * 일일 Activity 사이클 수 (24시간 × 60분 × 60초 ÷ 6초)
     */
    private static final int DAILY_ACTIVITY_CYCLES = 14400;

    /**
     * 활성 광고 수를 기반으로 일일 예상 노출 수 계산
     *
     * @param activeAdsCount 현재 활성 광고 수
     * @return 광고당 일일 예상 노출 수
     */
    public static long calculateEstimatedDailyExposure(int activeAdsCount) {
        if (activeAdsCount == 0) {
            return 0;
        }
        return DAILY_ACTIVITY_CYCLES / activeAdsCount;
    }

    /**
     * 광고가 활성화된 기간을 고려한 총 예상 노출 수 계산
     *
     * @param activeAdsCount 현재 활성 광고 수
     * @param activeDays 광고가 활성 상태였던 일수
     * @return 총 예상 노출 수
     */
    public static long calculateTotalEstimatedExposure(int activeAdsCount, int activeDays) {
        if (activeAdsCount == 0 || activeDays == 0) {
            return 0;
        }
        return calculateEstimatedDailyExposure(activeAdsCount) * activeDays;
    }
}