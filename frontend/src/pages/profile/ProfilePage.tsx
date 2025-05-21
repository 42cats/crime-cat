import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProfileDetail, ProfileDetailDto } from '@/api/profile/detail';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileBio from '@/components/profile/ProfileBio';
import ProfileThemeGrid from '@/components/profile/ProfileThemeGrid';
import ProfileDetailModal from '@/components/profile/ProfileDetailModal';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileModalId, setProfileModalId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    getProfileDetail(userId)
      .then((data) => {
        console.log("프로필 데이터:", data);
        setProfile(data);
      })
      .catch((err) => {
        console.error("프로필 로드 실패:", err);
        setError("프로필을 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // 프로필 모달 열기 이벤트 리스너
  useEffect(() => {
    const handleOpenProfile = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId: string }>;
      if (customEvent.detail && customEvent.detail.userId) {
        setProfileModalId(customEvent.detail.userId);
        setIsModalOpen(true);
      }
    };

    window.addEventListener('open-profile', handleOpenProfile as EventListener);
    
    // 현재 URL이 /profile/:userId 형태면 모달 자동 열기
    if (userId) {
      setProfileModalId(userId);
      setIsModalOpen(true);
    }

    return () => {
      window.removeEventListener('open-profile', handleOpenProfile as EventListener);
    };
  }, [userId]);

  if (loading) {
    return <div className="container mx-auto p-8">
      <div className="animate-pulse space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-gray-200"></div>
          <div className="space-y-4 flex-1">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>;
  }

  if (error || !profile) {
    return <div className="container mx-auto p-8 text-center">
      <h1 className="text-2xl font-bold text-red-500 mb-4">오류 발생</h1>
      <p className="text-gray-600">{error || "알 수 없는 오류가 발생했습니다."}</p>
    </div>;
  }

  return (
    <>
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
          <ProfileHeader profile={profile} />
          
          <div className="p-6">
            <ProfileBio bio={profile.bio} />
            
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="border-b-2 border-blue-500 pb-1">제작 테마</span>
              </h2>
              <ProfileThemeGrid userId={profile.userId} />
            </div>
          </div>
        </div>
      </div>

      {/* 프로필 상세 모달 */}
      {profileModalId && (
        <ProfileDetailModal
          userId={profileModalId}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </>
  );
};

export default ProfilePage;
