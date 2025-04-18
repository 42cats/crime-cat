import { useRecoilState } from 'recoil';
import { userState, isLoadingState } from '@/atoms/auth';
import { authService } from '@/api/authService';

export const useAuth = () => {
  const [user, setUser] = useRecoilState(userState);
  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);

  const getCurrentUser = async () => {
    setIsLoading(true);
    try {
      const user = await authService.getCurrentUser();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username?: string, password?: string) => {
    const user = await authService.login(username, password);
    setUser(user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    getCurrentUser,
  };
};
