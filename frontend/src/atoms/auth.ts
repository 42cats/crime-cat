import { atom } from 'recoil';
import { User } from '@/lib/types';

export const userState = atom<User | null>({
  key: 'userState',
  default: null,
});

export const isLoadingState = atom<boolean>({
  key: 'isLoadingState',
  default: true,
});