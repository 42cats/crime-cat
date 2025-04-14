import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const stateRaw = params.get('state');

    const errorProcess = () => {
        alert('로그인 처리 중 오류가 발생했습니다.');
        navigate('/login');
    }

    if (!code || !stateRaw) {
      errorProcess();
      return;
    }

    try {
      const parsedState = JSON.parse(decodeURIComponent(stateRaw));
      const provider = parsedState.provider || 'unknown';
      navigate(`/login/oauth2/loading?code=${code}&provider=${provider}`);
    } catch (err) {
      console.error('Error : ', err);
      errorProcess();
    }

  }, []);

  return null;
};

export default OAuthCallback;