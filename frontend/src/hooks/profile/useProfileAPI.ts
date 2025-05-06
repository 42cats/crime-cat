import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import * as ProfileAPI from '@/api/profile';

/**
 * 프로필 관련 API 통신 훅
 * 모든 프로필 관련 기능을 편리하게 사용할 수 있는 커스텀 훅
 */
export const useProfileAPI = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 닉네임 중복 체크
  const checkNickname = useCallback(async (nickname: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ProfileAPI.checkNicknameDuplicate(nickname);
      
      // 이미 사용 중인 닉네임인 경우
      if (!result.isAvailable) {
        toast({
          title: '닉네임 중복',
          description: result.message || '이미 사용 중인 닉네임입니다.',
        });
        return false;
      }
      
      toast({
        title: '사용 가능한 닉네임',
        description: '사용 가능한 닉네임입니다.',
      });
      return true;
    } catch (err: any) {
      setError(err.message || '닉네임 중복 확인 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '닉네임 중복 확인 중 오류가 발생했습니다.',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 프로필 정보 가져오기
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const profile = await ProfileAPI.getUserProfile(user.id);
      return profile;
    } catch (err: any) {
      setError(err.message || '프로필 정보를 불러오는 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '프로필 정보를 불러오는 중 오류가 발생했습니다.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 프로필 정보 업데이트
  const updateProfile = useCallback(async (profileData: ProfileAPI.ProfileUpdateParams) => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedProfile = await ProfileAPI.updateUserProfile(user.id, profileData);
      
      toast({
        title: '성공',
        description: '프로필 정보가 성공적으로 업데이트되었습니다.',
      });
      
      return updatedProfile;
    } catch (err: any) {
      setError(err.message || '프로필 업데이트 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '프로필 업데이트 중 오류가 발생했습니다.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 프로필 이미지만 업데이트
  const updateProfileImage = useCallback(async (imageFile: File) => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await ProfileAPI.updateProfileImage(user.id, imageFile);
      
      toast({
        title: '성공',
        description: '프로필 이미지가 성공적으로 업데이트되었습니다.',
      });
      
      return result.avatarUrl;
    } catch (err: any) {
      setError(err.message || '프로필 이미지 업데이트 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '프로필 이미지 업데이트 중 오류가 발생했습니다.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 소셜 링크 업데이트
  const updateSocialLinks = useCallback(async (socialLinks: { instagram?: string; x?: string; openkakao?: string }) => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await ProfileAPI.updateSocialLinks(user.id, socialLinks);
      
      toast({
        title: '성공',
        description: '소셜 링크가 성공적으로 업데이트되었습니다.',
      });
      
      return result;
    } catch (err: any) {
      setError(err.message || '소셜 링크 업데이트 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '소셜 링크 업데이트 중 오류가 발생했습니다.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 사용 가능한 배지 목록 조회
  const fetchAvailableBadges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const badges = await ProfileAPI.getAllBadges();
      return badges;
    } catch (err: any) {
      setError(err.message || '배지 목록을 불러오는 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '배지 목록을 불러오는 중 오류가 발생했습니다.',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 사용자의 배지 목록 조회
  const fetchUserBadges = useCallback(async () => {
    if (!user?.id) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const badges = await ProfileAPI.getUserBadges(user.id);
      return badges;
    } catch (err: any) {
      setError(err.message || '사용자 배지 목록을 불러오는 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '사용자 배지 목록을 불러오는 중 오류가 발생했습니다.',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 활성 배지 설정
  const setActiveBadge = useCallback(async (badgeId: string | null) => {
    if (!user?.id) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      await ProfileAPI.setActiveBadge(user.id, badgeId);
      
      toast({
        title: '성공',
        description: badgeId ? '칭호가 성공적으로 변경되었습니다.' : '칭호가 해제되었습니다.',
      });
      
      return true;
    } catch (err: any) {
      setError(err.message || '칭호 변경 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '칭호 변경 중 오류가 발생했습니다.',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 알림 설정 조회
  const fetchNotificationSettings = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const settings = await ProfileAPI.getNotificationSettings(user.id);
      return settings;
    } catch (err: any) {
      setError(err.message || '알림 설정을 불러오는 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '알림 설정을 불러오는 중 오류가 발생했습니다.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 이메일 알림 설정 변경
  const updateEmailNotification = useCallback(async (enabled: boolean) => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const settings = await ProfileAPI.updateEmailNotifications(user.id, enabled);
      
      toast({
        title: '성공',
        description: `이메일 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`,
      });
      
      return settings;
    } catch (err: any) {
      setError(err.message || '이메일 알림 설정 변경 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '이메일 알림 설정 변경 중 오류가 발생했습니다.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 디스코드 알림 설정 변경
  const updateDiscordNotification = useCallback(async (enabled: boolean) => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const settings = await ProfileAPI.updateDiscordNotifications(user.id, enabled);
      
      toast({
        title: '성공',
        description: `디스코드 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`,
      });
      
      return settings;
    } catch (err: any) {
      setError(err.message || '디스코드 알림 설정 변경 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '디스코드 알림 설정 변경 중 오류가 발생했습니다.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 모든 알림 설정 한 번에 변경
  const updateAllNotifications = useCallback(async (settings: ProfileAPI.NotificationSettings) => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedSettings = await ProfileAPI.updateAllNotificationSettings(user.id, settings);
      
      toast({
        title: '성공',
        description: '알림 설정이 성공적으로 업데이트되었습니다.',
      });
      
      return updatedSettings;
    } catch (err: any) {
      setError(err.message || '알림 설정 업데이트 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '알림 설정 업데이트 중 오류가 발생했습니다.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 계정 탈퇴
  const deleteUserAccount = useCallback(async (password: string) => {
    if (!user?.id) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      await ProfileAPI.deleteAccount(user.id, password);
      
      toast({
        title: '계정 탈퇴 완료',
        description: '계정이 성공적으로 탈퇴되었습니다. 이용해 주셔서 감사합니다.',
      });
      
      return true;
    } catch (err: any) {
      setError(err.message || '계정 탈퇴 중 오류가 발생했습니다.');
      toast({
        title: '오류',
        description: '계정 탈퇴 중 오류가 발생했습니다. 비밀번호를 다시 확인해주세요.',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return {
    loading,
    error,
    // 프로필 관련
    fetchProfile,
    updateProfile,
    updateProfileImage,
    updateSocialLinks,
    // 닉네임 관련
    checkNickname,
    // 배지 관련
    fetchAvailableBadges,
    fetchUserBadges,
    setActiveBadge,
    // 알림 설정 관련
    fetchNotificationSettings,
    updateEmailNotification,
    updateDiscordNotification,
    updateAllNotifications,
    // 계정 관련
    deleteUserAccount,
  };
};

export default useProfileAPI;
