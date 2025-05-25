import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { PaginationController } from "@/components/ui/pagination-controller";
import { useUserSearchQuery } from "./hooks/useFollowQueries";
import { useFollowMutations } from "./hooks/useFollowMutations";
import SearchResultCard from "./SearchResultCard";
import UserCardSkeleton from "./UserCardSkeleton";

/**
 * 사용자 검색 컴포넌트
 * 검색 폼과 검색 결과를 표시
 */
export const UserSearch: React.FC = () => {
  // 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPage, setSearchPage] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  
  // 검색 쿼리와 뮤테이션 훅
  const { user, searchResults, isLoadingSearch, isFetchingSearch, refetchSearch } = 
    useUserSearchQuery(searchQuery, searchPage, 10, showSearch);
  const { followMutation, unfollowMutation } = useFollowMutations();

  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchPage(0);
      setShowSearch(true);
      refetchSearch();
    }
  };

  // 검색어 입력 핸들러
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value === "") {
      setShowSearch(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">사용자 검색</CardTitle>
        <CardDescription>
          닉네임으로 사용자를 검색하여 팔로우할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="flex-1">
            <Input
              type="search"
              placeholder="닉네임 또는 고유아이디 입력..."
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
          </div>
          <Button type="submit" disabled={!searchQuery.trim()}>
            <Search className="mr-2 h-4 w-4" />
            검색
          </Button>
        </form>
      </CardContent>

      {/* 검색 결과 표시 */}
      {showSearch && searchQuery && (
        <CardFooter className="flex flex-col">
          <div className="flex items-center justify-between w-full mb-3">
            <h3 className="text-lg font-medium">검색 결과</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
            >
              <X className="h-4 w-4 mr-1" />
              닫기
            </Button>
          </div>

          {isLoadingSearch || isFetchingSearch ? (
            <div className="w-full">
              {[...Array(3)].map((_, index) => (
                <UserCardSkeleton key={index} />
              ))}
            </div>
          ) : searchResults?.users && searchResults.users.length > 0 ? (
            <AnimatePresence>
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {searchResults.users.map((userInfo) => (
                  <SearchResultCard
                    key={userInfo.id}
                    user={userInfo}
                    currentUserId={user?.id || ""}
                    followMutation={followMutation}
                    unfollowMutation={unfollowMutation}
                  />
                ))}

                {/* 검색 결과 페이지네이션 */}
                {searchResults.totalPages > 1 && (
                  <PaginationController
                    totalPages={searchResults.totalPages}
                    currentPage={searchPage + 1}
                    onPageChange={(page) => setSearchPage(page - 1)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              검색 결과가 없습니다
            </p>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default UserSearch;
