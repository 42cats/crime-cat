export { default as ThemeHeader } from './ThemeHeader';
export { default as ThemeActions } from './ThemeActions';
export { default as ThemeInfoGrid } from './ThemeInfoGrid';
export { default as ThemeTeamInfo } from './ThemeTeamInfo';
export { default as ThemeGuildInfo } from './ThemeGuildInfo';
export { default as ThemeContent } from './ThemeContent';
export { default as ThemeComments } from './ThemeComments';
export { default as ThemeModals } from './ThemeModals';

// 모든 컴포넌트를 하나의 객체로 내보내기
import ThemeHeader from './ThemeHeader';
import ThemeActions from './ThemeActions';
import ThemeInfoGrid from './ThemeInfoGrid';
import ThemeTeamInfo from './ThemeTeamInfo';
import ThemeGuildInfo from './ThemeGuildInfo';
import ThemeContent from './ThemeContent';
import ThemeComments from './ThemeComments';
import ThemeModals from './ThemeModals';

export const ThemeDetailComponents = {
  ThemeHeader,
  ThemeActions,
  ThemeInfoGrid,
  ThemeTeamInfo,
  ThemeGuildInfo,
  ThemeContent,
  ThemeComments,
  ThemeModals
};
