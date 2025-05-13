export interface PointHistory {
  id: string;
  type: 'CHARGE' | 'USE' | 'GIFT' | 'RECEIVE' | 'REFUND' | 'EXPIRE' | 'COUPON' | 'DAILY';
  amount: number;
  balanceAfter: number;
  itemType?: 'PERMISSION';
  permissionName?: string;
  relatedNickname?: string;
  memo: string;
  usedAt: string;
}

export interface PointSummary {
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  totalReceived: number;
  totalGifted: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageSize: number;
    pageNumber: number;
    paged: boolean;
    unpaged: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

export type TransactionType = PointHistory['type'];

export type SortType = 'LATEST' | 'OLDEST' | 'AMOUNT_DESC' | 'AMOUNT_ASC' | 'BALANCE_DESC' | 'BALANCE_ASC';

export interface SortOption {
  value: SortType;
  label: string;
  description: string;
}
