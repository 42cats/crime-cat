import { useEffect, useState, useCallback } from "react";
import { useSetRecoilState } from 'recoil';
import { registerSetUser } from '@/utils/authUtils';
import { fetchCsrfToken } from '@/utils/csrfUtils';
import { userState } from '@/atoms/auth';
import { useAuth } from "@/hooks/useAuth";

const AuthInitializer = () => {
  const { user, getCurrentUser } = useAuth();
  const setUser = useSetRecoilState(userState);
  const [csrfInitialized, setCsrfInitialized] = useState(false);
  const [tokenRetryCount, setTokenRetryCount] = useState(0);
  const [authAttempted, setAuthAttempted] = useState(false); // 인증 시도 여부 플래그

  registerSetUser(setUser);
  
  // 사용자 정보 요청 함수 메모이제이션
  const fetchCurrentUser = useCallback(async () => {
    if (!authAttempted) {
      setAuthAttempted(true); // 인증 시도 플래그 설정
      try {
        await getCurrentUser();
        console.log('getCurrentUser 요청 완료');
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
      }
    } else {
      console.log('이미 인증 시도했음');
    }
  }, [getCurrentUser, authAttempted]);

  // 초기 CSRF 토큰 설정
  useEffect(() => {
    const initializeCsrf = async () => {
      try {
        // fetchCsrfToken은 sessionStorage에 토큰이 있으면 서버 요청을 하지 않음
        const token = await fetchCsrfToken();
        if (token) {
          setCsrfInitialized(true);
          setTokenRetryCount(0);
        } else {
          console.warn('CSRF 토큰을 받지 못함');
          // 최대 3번까지 재시도
          if (tokenRetryCount < 3) {
            setTimeout(() => {
              setTokenRetryCount(prev => prev + 1);
              setCsrfInitialized(false);
            }, 1000);
          } else {
            console.error('CSRF 토큰 설정 최대 재시도 횟수 초과');
            setCsrfInitialized(true); // 진행은 함
          }
        }
      } catch (error) {
        console.error('CSRF 토큰 설정 실패:', error);
        if (tokenRetryCount < 3) {
          setTimeout(() => {
            setTokenRetryCount(prev => prev + 1);
            setCsrfInitialized(false);
          }, 1000);
        } else {
          console.error('CSRF 토큰 설정 최대 재시도 횟수 초과');
          setCsrfInitialized(true);
        }
      }
    };
    
    if (!csrfInitialized) {
      initializeCsrf();
    }
  }, [csrfInitialized, tokenRetryCount]);

  // 사용자 정보 가져오기 - 토큰 초기화 후 한 번만 실행
  useEffect(() => {
    if (csrfInitialized && !authAttempted) {
      console.log('초기 사용자 정보 요청 시도');
      fetchCurrentUser();
    }
  }, [csrfInitialized, authAttempted, fetchCurrentUser]);
  
  // 사용자가 null일 경우에도 한 번은 반드시 인증 시도
  useEffect(() => {
    if (csrfInitialized && user === null && !authAttempted) {
      console.log('사용자가 null이지만 인증 시도 필요');
      fetchCurrentUser();
    }
  }, [csrfInitialized, user, authAttempted, fetchCurrentUser]);

  return null;
};

export default AuthInitializer;