import { useEffect } from "react";
import { useSetRecoilState } from 'recoil';
import { registerSetUser } from '@/utils/authUtils';
import { fetchCsrfToken } from '@/utils/csrfUtils';
import { userState } from '@/atoms/auth';
import { useAuth } from "@/hooks/useAuth";

const AuthInitializer = () => {
  const { user, getCurrentUser } = useAuth();
  const setUser = useSetRecoilState(userState);

  registerSetUser(setUser);

  useEffect(() => {
    // CSRF 토큰 초기화
    fetchCsrfToken();
    
    if (!user) {
      getCurrentUser();
    }
  }, []);

  return null;
};

export default AuthInitializer;