import { apiClient } from '@/lib/api';
import { Coupon } from '@/lib/types';

const baseURI = '/web_user/coupon';

export const couponService = {
  requestCoupon: async (id: string, code: string): Promise<Coupon> => {
    try {
      return await apiClient.patch<Coupon>(`${baseURI}`, { userId: id, code:code });
    } catch (error) {
      console.error('쿠폰 적용 실패:', error);
      throw error;
    }
  },
};