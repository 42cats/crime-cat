import React, { useEffect, useState, useRef, useCallback } from "react";
import { getFollowings, FollowDto } from "@/api/follow";
import UserListItem from "./UserListItem";
import { Loader2 } from "lucide-react";

interface ProfileFollowingListProps {
  userId: string;
  onProfileClick: (userId: string) => void;
}

const ProfileFollowingList: React.FC<ProfileFollowingListProps> = ({
  userId,
  onProfileClick,
}) => {
  const [followings, setFollowings] = useState<FollowDto[]>([]);
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

  // 팔로잉 목록 가져오기
  const fetchFollowings = useCallback(async () => {
    if (!userId || !hasMore || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getFollowings(userId, page);
      setFollowings((prev) => [...prev, ...response.content]);
      setHasMore(response.hasNext);
    } catch (err) {
      console.error("팔로잉 목록 로딩 실패:", err);
      setError("팔로잉 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [userId, page, hasMore, loading]);

  // 페이지가 변경될 때마다 팔로잉 가져오기
  useEffect(() => {
    fetchFollowings();
  }, [fetchFollowings]);

  // 사용자 ID가 변경되면 목록 초기화
  useEffect(() => {
    setFollowings([]);
    setPage(0);
    setHasMore(true);
    setError(null);
  }, [userId]);

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {followings.length === 0 && !loading ? (
        <div className="p-8 text-center text-gray-500">
          <p>팔로잉이 없습니다.</p>
        </div>
      ) : (
        followings.map((following, index) => {
          const isLastElement = index === followings.length - 1;
          return (
            <div
              key={following.id || index}
              ref={isLastElement ? lastElementRef : undefined}
            >
              <UserListItem
                userId={following.followingId}
                nickname={following.followingNickname}
                profileImage={following.followingProfileImage}
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

export default ProfileFollowingList;
