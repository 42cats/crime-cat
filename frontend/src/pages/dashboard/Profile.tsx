import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import PageTransition from "@/components/PageTransition";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Instagram, X, MessageCircleMore } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

const Profile: React.FC = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [avatar, setAvatar] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
    const [notifyByEmail, setNotifyByEmail] = useState(true);
    const [notifyByDiscord, setNotifyByDiscord] = useState(true);
    const [instagram, setInstagram] = useState("");
    const [twitter, setTwitter] = useState("");
    const [discord, setDiscord] = useState("");

    const badgeList = ["개발자", "디자이너", "기여자", "운영자"];

    const [originalData, setOriginalData] = useState<any>({});

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        navigate('/login');
      }
      setNickname(user?.nickname);
      setBio(user?.bio);
      setSelectedBadge(user?.badge);
      setInstagram(user.social_links?.instagram);
      setTwitter(user.social_links?.x);
      setDiscord(user.social_links?.openkakao);
      setCroppedImageUrl("/default-profile.jpg");
      setOriginalData(user);
    }, [isAuthenticated, isLoading, navigate]);

    const getDiff = (original: any, updated: any) => {
      const diff: any = {};
      for (const key in updated) {
        if (updated[key] !== original[key]) {
          diff[key] = updated[key];
        }
      }
      return diff;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setAvatar(e.target.files[0]);
        setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        setShowCropModal(true);
      }
    };

    const onCropComplete = useCallback((_croppedArea: any, pixels: any) => {
      setCroppedAreaPixels(pixels);
    }, []);

    const getCroppedImage = async (): Promise<Blob | null> => {
      if (!previewUrl || !croppedAreaPixels) return null;

      const image = new Image();
      image.src = previewUrl;
      await new Promise((res) => (image.onload = res));

      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
  
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg");
      });
    };

    const applyCroppedImage = async () => {
      const blob = await getCroppedImage();
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCroppedImageUrl(url);
        setShowCropModal(false);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const updatedData = {
          nickname,
          bio,
          badge: selectedBadge,
          instagram,
          twitter,
          discord,
        };

        const diffPayload = getDiff(originalData, updatedData);

        // PATCH 요청 예시 (axios 또는 apiClient 사용 가능)
        console.log("변경된 필드만 전송:", diffPayload);

        toast({
          title: "✅ 프로필 저장 완료",
          description: "변경 사항이 성공적으로 반영되었습니다.",
        });

        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } catch {
        toast({
          title: "❌ 저장 실패",
          description: "다시 시도해주세요.",
        });
      }
    };

    const handleDeleteAccount = () => {
      toast({
        title: "🚨 계정 탈퇴",
        description: "계정이 탈퇴되었습니다.",
      });
    };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>프로필 수정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="shrink-0 w-full md:w-64 space-y-4">
                  <div className="aspect-square bg-muted rounded overflow-hidden flex items-center justify-center">
                    {croppedImageUrl ? (
                      <img
                        src={croppedImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">이미지 없음</div>
                    )}
                  </div>
                  <Label>프로필 이미지</Label>
                  <Input type="file" accept="image/*" onChange={handleImageChange} />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">닉네임</Label>
                    <div className="flex gap-2">
                      <Input
                        id="nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="닉네임을 입력하세요"
                      />
                      <Button type="button" variant="outline" size="sm">중복확인</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>SNS 연동</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-5 h-5" />
                        <Input
                          placeholder="Instagram 링크 입력"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <X className="w-5 h-5" />
                        <Input
                          placeholder="Twitter 링크 입력"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircleMore className="w-5 h-5" />
                        <Input
                          placeholder="Discord 또는 카카오톡 링크"
                          value={discord}
                          onChange={(e) => setDiscord(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>칭호</Label>
                    <Button type="button" variant="outline" onClick={() => setShowBadgeModal(true)}>
                      {selectedBadge ? <Badge>{selectedBadge}</Badge> : "칭호 선택"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>알림 설정</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={notifyByEmail} onCheckedChange={setNotifyByEmail} />
                        <span>메일</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={notifyByDiscord} onCheckedChange={setNotifyByDiscord} />
                        <span>디스코드</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">자기소개</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="당신을 간단히 소개해 주세요"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="destructive" onClick={handleDeleteAccount}>
                계정 탈퇴하기
              </Button>
              <Button type="submit">저장하기</Button>
            </CardFooter>
          </form>
        </Card>
        {/* 크롭 모달 */}
        <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>이미지 자르기</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-square bg-muted rounded overflow-hidden">
              <Cropper
                image={previewUrl ?? undefined}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <Button className="mt-4 w-full" onClick={applyCroppedImage}>
              적용하기
            </Button>
          </DialogContent>
        </Dialog>
        {/* 칭호 선택 모달 */}
        <Dialog open={showBadgeModal} onOpenChange={setShowBadgeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>보유한 칭호 선택</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              {badgeList.map((badge) => (
                <Badge
                  key={badge}
                  className={`cursor-pointer ${selectedBadge === badge ? "bg-primary text-white" : ""}`}
                  onClick={() => {
                    setSelectedBadge(badge);
                    setShowBadgeModal(false);
                  }}
                >
                  {badge}
                </Badge>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default Profile;
