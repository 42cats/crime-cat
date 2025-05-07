import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

interface ProfileFormProps {
  nickname: string;
  setNickname: (nickname: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  selectedBadge: string | null;
  setShowBadgeModal: (show: boolean) => void;
  checkNickname: () => Promise<void>;
  isNicknameValid: boolean;
  nicknameChecked: boolean;
  isDark: boolean;
}

/**
 * 프로필 정보 입력 폼 컴포넌트
 */
const ProfileForm: React.FC<ProfileFormProps> = ({
  nickname,
  setNickname,
  bio,
  setBio,
  selectedBadge,
  setShowBadgeModal,
  checkNickname,
  isNicknameValid,
  nicknameChecked,
  isDark,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="nickname" className="text-base font-medium">닉네임</Label>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                // 입력이 변경되면 체크 상태 초기화
                if (nicknameChecked) {
                  // 이 부분은 원하는 경우에만 구현
                }
              }}
              placeholder="닉네임을 입력하세요"
              className={cn(
                "transition-all pr-10",
                isDark ? "focus-visible:ring-indigo-500" : "focus-visible:ring-indigo-400",
                nicknameChecked && !isNicknameValid && "border-red-500 focus-visible:ring-red-500",
                nicknameChecked && isNicknameValid && "border-green-500 focus-visible:ring-green-500"
              )}
            />
            {nicknameChecked && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isNicknameValid ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            className="whitespace-nowrap"
            onClick={checkNickname}
          >
            중복확인
          </Button>
        </div>
        {nicknameChecked && !isNicknameValid && (
          <p className="text-xs text-red-500 mt-1">사용할 수 없는 닉네임입니다.</p>
        )}
        {nicknameChecked && isNicknameValid && (
          <p className="text-xs text-green-500 mt-1">사용 가능한 닉네임입니다.</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-base font-medium">자기소개</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="당신을 간단히 소개해 주세요"
          className="min-h-32"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-base font-medium">칭호 설정</Label>
        <div className="flex">
          <Button 
            type="button" 
            variant={selectedBadge ? "outline" : "default"}
            size="sm"
            onClick={() => setShowBadgeModal(true)}
            className={cn(
              "transition-all",
              isDark ? "hover:bg-indigo-900/40" : "hover:bg-indigo-100"
            )}
          >
            {selectedBadge ? "칭호 변경" : "칭호 선택"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
