import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users } from "lucide-react";
import { FollowCountResponse } from "@/lib/api/followApi";
import FollowersList from "./FollowersList";
import FollowingsList from "./FollowingsList";

interface FollowTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  followCounts: FollowCountResponse | undefined;
  followers: any;
  isLoadingFollowers: boolean;
  isFetchingFollowers: boolean;
  followings: any;
  isLoadingFollowings: boolean;
  isFetchingFollowings: boolean;
  currentUserId: string;
  followersPage: number;
  setFollowersPage: (page: number) => void;
  followingsPage: number;
  setFollowingsPage: (page: number) => void;
}

/**
 * 팔로워/팔로잉 탭 컴포넌트
 */
export const FollowTabs: React.FC<FollowTabsProps> = ({
  activeTab,
  setActiveTab,
  followCounts,
  followers,
  isLoadingFollowers,
  isFetchingFollowers,
  followings,
  isLoadingFollowings,
  isFetchingFollowings,
  currentUserId,
  followersPage,
  setFollowersPage,
  followingsPage,
  setFollowingsPage,
}) => {
  return (
    <Tabs
      defaultValue="followers"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="followers" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            팔로워 ({followCounts?.followerCount || 0})
          </TabsTrigger>
          <TabsTrigger value="followings" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            팔로잉 ({followCounts?.followingCount || 0})
          </TabsTrigger>
        </TabsList>
      </div>

      {/* 팔로워 탭 콘텐츠 */}
      <TabsContent value="followers">
        <FollowersList
          followers={followers}
          isLoading={isLoadingFollowers}
          isFetching={isFetchingFollowers}
          currentUserId={currentUserId}
          followersPage={followersPage}
          setFollowersPage={setFollowersPage}
        />
      </TabsContent>

      {/* 팔로잉 탭 콘텐츠 */}
      <TabsContent value="followings">
        <FollowingsList
          followings={followings}
          isLoading={isLoadingFollowings}
          isFetching={isFetchingFollowings}
          currentUserId={currentUserId}
          followingsPage={followingsPage}
          setFollowingsPage={setFollowingsPage}
        />
      </TabsContent>
    </Tabs>
  );
};

export default FollowTabs;
