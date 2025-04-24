import { apiClient } from '@/lib/api';
import { Coupon } from '@/lib/types';

export const couponService = {
  requestCoupon: async (id: string, code: string): Promise<Coupon> => {
	try {
	  return await apiClient.patch<Coupon>(`/web_user/coupon`, { userId: id, code:code });
	} catch (error) {
	  console.error('쿠폰 적용 실패:', error);
	  throw error;
	}
  },
};