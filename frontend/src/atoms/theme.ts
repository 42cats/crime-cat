import { atom } from 'recoil';

export type Theme = 'light' | 'dark';

export const themeState = atom<Theme>({
  key: 'themeState',
  default: (localStorage.getItem('theme') as Theme) || 'light',
});