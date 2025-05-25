import React, { useState } from "react";
import { FollowsHeader, UserSearch, FollowTabs } from "./components";
import { useFollowQueries } from "./components/hooks/useFollowQueries";

/**
 * 팔로우 관리 페이지
 * 팔로워와 팔로잉을 확인하고 관리할 수 있는 페이지
 */
const FollowsPage: React.FC = () => {
  // 현재 선택된 탭(팔로워/팔로잉)
  const [activeTab, setActiveTab] = useState<string>("followers");

  // 팔로워/팔로잉 페이지네이션 상태
  const [followersPage, setFollowersPage] = useState(0);
  const [followingsPage, setFollowingsPage] = useState(0);
  const pageSize = 10;

  // 팔로우 관련 쿼리 훅 사용
  const {
    user,
    userId,
    followCounts,
    isLoadingCounts,
    followers,
    isLoadingFollowers,
    isFetchingFollowers,
    followings,
    isLoadingFollowings,
    isFetchingFollowings,
  } = useFollowQueries(followersPage, followingsPage, pageSize);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 (제목 및 카운트) */}
      <FollowsHeader 
        followCounts={followCounts} 
        isLoading={isLoadingCounts} 
      />

      {/* 사용자 검색 폼 */}
      <UserSearch />

      {/* 팔로워/팔로잉 탭 */}
      <FollowTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        followCounts={followCounts}
        followers={followers}
        isLoadingFollowers={isLoadingFollowers}
        isFetchingFollowers={isFetchingFollowers}
        followings={followings}
        isLoadingFollowings={isLoadingFollowings}
        isFetchingFollowings={isFetchingFollowings}
        currentUserId={userId}
        followersPage={followersPage}
        setFollowersPage={setFollowersPage}
        followingsPage={followingsPage}
        setFollowingsPage={setFollowingsPage}
      />
    </div>
  );
};

export default FollowsPage;
