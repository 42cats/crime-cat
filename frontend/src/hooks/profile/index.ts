import useProfileAPI from './useProfileAPI';

export { useProfileAPI };

/**
 * 프로필 관련 커스텀 훅
 * 
 * 사용 예시:
 * ```tsx
 * import { useProfileAPI } from '@/hooks/profile';
 * 
 * const ProfileComponent = () => {
 *   const { 
 *     loading, 
 *     fetchProfile, 
 *     updateProfile,
 *     checkNickname
 *   } = useProfileAPI();
 *   
 *   // 프로필 정보 불러오기
 *   useEffect(() => {
 *     const loadProfile = async () => {
 *       const profileData = await fetchProfile();
 *       if (profileData) {
 *         // 프로필 데이터로 상태 설정
 *       }
 *     };
 *     
 *     loadProfile();
 *   }, [fetchProfile]);
 *   
 *   // 중복 닉네임 체크 핸들러
 *   const handleCheckNickname = async () => {
 *     const isAvailable = await checkNickname(nickname);
 *     if (isAvailable) {
 *       // 사용 가능한 닉네임
 *     }
 *   };
 *   
 *   return (
 *     // ...
 *   );
 * };
 * ```
 */
