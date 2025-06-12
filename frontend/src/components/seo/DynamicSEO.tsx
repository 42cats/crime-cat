import { useSEO } from '@/hooks/useSEO';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { apiConfig } from '@/config/apiConfig';

// 테마 상세 페이지 SEO
export const ThemeSEO = () => {
  const { category, id } = useParams();
  const [themeData, setThemeData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchThemeData();
    }
  }, [id]);

  const fetchThemeData = async () => {
    try {
      const response = await axios.get(`${apiConfig.baseURL}/public/themes/${id}`);
      setThemeData(response.data);
    } catch (error) {
      console.error('테마 데이터 로드 실패:', error);
    }
  };

  useSEO({
    title: themeData?.title || '테마 상세',
    description: themeData?.description || '미스터리 플레이스의 추리 게임 테마입니다.',
    image: themeData?.imageUrl,
    type: 'article',
    author: themeData?.author?.nickname,
    publishedTime: themeData?.createdAt,
    modifiedTime: themeData?.updatedAt,
    keywords: [
      '추리게임',
      category === 'crimescene' ? '크라임씬' : category === 'escape_room' ? '방탈출' : '머더미스터리',
      themeData?.title,
      '미스터리'
    ].filter(Boolean),
  });

  return null;
};

// 프로필 페이지 SEO
export const ProfileSEO = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${apiConfig.baseURL}/public/web_users/${userId}/profile/detail`);
      setUserData(response.data);
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
    }
  };

  useSEO({
    title: userData?.nickname ? `${userData.nickname}의 프로필` : '사용자 프로필',
    description: userData?.bio || `${userData?.nickname || '사용자'}의 미스터리 플레이스 프로필입니다.`,
    image: userData?.profileImage,
    type: 'profile',
    keywords: ['프로필', userData?.nickname, '미스터리 플레이스'].filter(Boolean),
  });

  return null;
};

// 게시글 SEO
export const PostSEO = ({ boardType }: { boardType: string }) => {
  const { id } = useParams();
  const [postData, setPostData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchPostData();
    }
  }, [id]);

  const fetchPostData = async () => {
    try {
      const response = await axios.get(`${apiConfig.baseURL}/public/posts/${id}`);
      setPostData(response.data);
    } catch (error) {
      console.error('게시글 데이터 로드 실패:', error);
    }
  };

  const boardTypeKorean = {
    question: '질문게시판',
    chat: '자유게시판',
    creator: '제작자게시판'
  }[boardType] || '게시판';

  useSEO({
    title: postData?.title || '게시글',
    description: postData?.content ? 
      postData.content.substring(0, 150).replace(/\n/g, ' ') + '...' : 
      `${boardTypeKorean}의 게시글입니다.`,
    type: 'article',
    author: postData?.author?.nickname,
    publishedTime: postData?.createdAt,
    modifiedTime: postData?.updatedAt,
    keywords: [boardTypeKorean, '커뮤니티', postData?.title].filter(Boolean),
  });

  return null;
};

// 정적 페이지 SEO
export const StaticPageSEO = ({ 
  title, 
  description, 
  keywords 
}: { 
  title: string; 
  description: string; 
  keywords?: string[] 
}) => {
  useSEO({
    title,
    description,
    keywords: keywords || ['미스터리 플레이스', '추리게임', '커뮤니티'],
  });

  return null;
};