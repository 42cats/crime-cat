import { useRecoilState } from 'recoil';
import { themeState } from '@/atoms/theme';
import { useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useRecoilState(themeState);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return { theme, setTheme, toggleTheme };
};