import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Plus, Search, Loader2 } from "lucide-react";
import { SearchUser } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { searchUserService } from "@/api/social/search";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";

interface UserSearchProps {
  teamId: string;
  teamMembers: { userId?: string }[];
  onAddMember: (user: SearchUser) => Promise<void>;
}

const UserSearch: React.FC<UserSearchProps> = ({
  teamId,
  teamMembers,
  onAddMember,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [fetchedUsers, setFetchedUsers] = useState<SearchUser[]>([]);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // 검색 결과 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 검색어 변경시 페이지 초기화
  useEffect(() => {
    setPage(0);
    setFetchedUsers([]);
  }, [debouncedQuery]);

  const { data: searchResult, isFetching } = useQuery({
    queryKey: ["search-user", debouncedQuery, page],
    queryFn: () =>
      searchUserService.getSearchUser(
        `keyword=${debouncedQuery}&page=${page}&size=5`
      ),
    enabled: debouncedQuery.trim().length >= 2,
  });

  useEffect(() => {
    if (searchResult) {
      setFetchedUsers((prev) =>
        page === 0 ? searchResult.content : [...prev, ...searchResult.content]
      );
    }
  }, [searchResult, page]);

  const isUserInTeam = (userId: string) =>
    teamMembers.some((member) => member.userId === userId);

  const handleAddMember = async (user: SearchUser) => {
    setAddingUserId(user.id);
    try {
      await onAddMember(user);
    } finally {
      setAddingUserId(null);
    }
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { 
      opacity: 1, 
      y: 0, 
      height: "auto",
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      height: 0,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <div className="relative space-y-1" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="닉네임으로 유저 검색 (2글자 이상)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
        {isFetching && (
          <Loader2 className="animate-spin absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <AnimatePresence>
        {debouncedQuery.trim().length >= 2 && fetchedUsers.length > 0 && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute z-20 w-full mt-1 bg-popover border shadow-lg rounded-md overflow-hidden"
          >
            <ul className="max-h-60 overflow-y-auto">
              <AnimatePresence>
                {fetchedUsers.map((user) => {
                  const inTeam = isUserInTeam(user.id);
                  const isAdding = addingUserId === user.id;
                  
                  return (
                    <motion.li
                      key={user.id}
                      variants={itemVariants}
                      className="flex justify-between items-center px-3 py-2 hover:bg-accent/50 transition-colors"
                    >
                      <span className="font-medium">{user.nickname}</span>
                      {inTeam ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleAddMember(user)}
                          disabled={isAdding}
                        >
                          {isAdding ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            
            {searchResult?.hasNext && (
              <Button
                onClick={() => setPage((prev) => prev + 1)}
                className="w-full rounded-none"
                variant="ghost"
                disabled={isFetching}
              >
                {isFetching ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    불러오는 중...
                  </div>
                ) : (
                  "더보기"
                )}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {debouncedQuery.trim().length >= 2 && 
       !isFetching && 
       fetchedUsers.length === 0 && (
        <div className="text-sm text-muted-foreground mt-1">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
};

export default UserSearch;