import React, { useEffect, useState, useRef, useCallback } from "react";
import { getFollowers, FollowDto } from "@/api/follow";
import UserListItem from "./UserListItem";
import { Loader2 } from "lucide-react";

interface ProfileFollowerListProps {
  userId: string;
  onProfileClick: (userId: string) => void;
  refresh?: boolean; // 데이터 리프레시 트리거
}

const ProfileFollowerList: React.FC<ProfileFollowerListProps> = ({
  userId,
  onProfileClick,
  refresh,
}) => {
  const [followers, setFollowers] = useState<FollowDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // 마지막 요소 참조 콜백 함수
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // 팔로워 목록 가져오기
  const fetchFollowers = useCallback(async () => {
    if (!userId || !hasMore || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getFollowers(userId, page);
      setFollowers((prev) => [...prev, ...response.content]);
      setHasMore(response.hasNext);
    } catch (err) {
      console.error("팔로워 목록 로딩 실패:", err);
      setError("팔로워 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [userId, page, hasMore, loading]);

  // 페이지가 변경될 때마다 팔로워 가져오기
  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  // 사용자 ID가 변경되거나 refresh 플래그가 변경되면 목록 초기화
  useEffect(() => {
    setFollowers([]);
    setPage(0);
    setHasMore(true);
    setError(null);
  }, [userId, refresh]);

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {followers.length === 0 && !loading ? (
        <div className="p-8 text-center text-gray-500">
          <p>팔로워가 없습니다.</p>
        </div>
      ) : (
        followers.map((follower, index) => {
          const isLastElement = index === followers.length - 1;
          return (
            <div
              key={follower.id || index}
              ref={isLastElement ? lastElementRef : undefined}
            >
              <UserListItem
                userId={follower.followerId}
                nickname={follower.followerNickname}
                profileImage={follower.followerProfileImage}
                onProfileClick={onProfileClick}
              />
            </div>
          );
        })
      )}
      {loading && (
        <div className="p-4 flex justify-center">
          <Loader2 className="animate-spin text-blue-500" size={24} />
        </div>
      )}
    </div>
  );
};

export default ProfileFollowerList;
