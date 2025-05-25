import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, X, MapPin, Phone, Calendar, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EscapeRoomLocationSearchModal from "@/components/themes/modals/EscapeRoomLocationSearchModal";

interface EscapeRoomLocation {
  storeName: string;
  address: string;
  roadAddress?: string;
  lat?: number;
  lng?: number;
  link?: string;
  phone?: string;
  description?: string;
}

interface Props {
  extraFields: any;
  setExtraFields: React.Dispatch<React.SetStateAction<any>>;
}

// 별점 표시 및 선택 컴포넌트 (1-10점, 0.5점 단위)
const RatingStars: React.FC<{
  rating: number;
  onRatingChange: (value: number) => void;
  hoveredRating: number | null;
  onHover: (value: number | null) => void;
  label: string;
}> = ({ rating, onRatingChange, hoveredRating, onHover, label }) => {
  const starElements = [];
  const displayValue = hoveredRating !== null ? hoveredRating : rating;

  for (let i = 1; i <= 5; i++) {
    const starFill = Math.min(Math.max(displayValue - (i - 1) * 2, 0), 2);

    starElements.push(
      <div key={i} className="relative w-6 h-6 cursor-pointer group">
        <Star className="w-6 h-6 text-muted-foreground" />
        {starFill > 0 && (
          <div
            className="absolute top-0 left-0 h-full overflow-hidden"
            style={{ width: `${(starFill / 2) * 100}%` }}
          >
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          </div>
        )}
        <div
          className="absolute top-0 left-0 w-1/2 h-full z-10"
          onMouseEnter={() => onHover(i * 2 - 1)}
          onClick={() => onRatingChange(i * 2 - 1)}
        />
        <div
          className="absolute top-0 right-0 w-1/2 h-full z-10"
          onMouseEnter={() => onHover(i * 2)}
          onClick={() => onRatingChange(i * 2)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex gap-1" onMouseLeave={() => onHover(null)}>
          {starElements}
        </div>
        <span className="text-sm text-muted-foreground min-w-[40px]">
          {rating > 0 ? `${rating}/10` : "0/10"}
        </span>
      </div>
    </div>
  );
};

const EscapeRoomFields: React.FC<Props> = ({ extraFields, setExtraFields }) => {
  const [hoveredRating, setHoveredRating] = useState<{
    horror: number | null;
    device: number | null;
    activity: number | null;
  }>({
    horror: null,
    device: null,
    activity: null,
  });

  const [newLocation, setNewLocation] = useState<EscapeRoomLocation>({
    storeName: "",
    address: "",
    roadAddress: "",
    phone: "",
    description: "",
  });


  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // extraFields 초기값 설정 - 편집 모드에서는 실행하지 않음
  React.useEffect(() => {
    // extraFields가 없거나 빈 객체인 경우에만 초기값 설정 (신규 생성 시)
    if (!extraFields || (Object.keys(extraFields).length === 0 && !extraFields.isOperating)) {
      console.log('EscapeRoomFields - 초기값 설정');
      setExtraFields({
        horrorLevel: 0,
        deviceRatio: 0,
        activityLevel: 0,
        openDate: "",
        isOperating: true,

        locations: [],
        homepageUrl: "",
        reservationUrl: "",
      });
    } else {
      console.log('EscapeRoomFields - 기존값 사용:', extraFields);
    }
  }, []);

  const updateField = (field: string, value: any) => {
    setExtraFields((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };



  const addLocation = () => {
    if (newLocation.storeName.trim() && newLocation.address.trim()) {
      updateField("locations", [...(extraFields.locations || []), { ...newLocation }]);
      setNewLocation({
        storeName: "",
        address: "",
        roadAddress: "",
        phone: "",
        description: "",
      });
    }
  };

  const removeLocation = (index: number) => {
    updateField(
      "locations",
      extraFields.locations?.filter((_: any, i: number) => i !== index) || []
    );
  };

  const handleLocationSelect = (location: {
    storeName: string;
    address: string;
    roadAddress: string;
    lat: number;
    lng: number;
    link: string;
    phone?: string;
    description?: string;
  }) => {
    updateField("locations", [...(extraFields.locations || []), location]);
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          방탈출 테마 전용 정보
        </h3>

        {/* 평점 시스템 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">테마 특성 평가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RatingStars
                rating={extraFields.horrorLevel || 0}
                onRatingChange={(value) => updateField("horrorLevel", value)}
                hoveredRating={hoveredRating.horror}
                onHover={(value) =>
                  setHoveredRating((prev) => ({ ...prev, horror: value }))
                }
                label="공포도"
              />
              <RatingStars
                rating={extraFields.deviceRatio || 0}
                onRatingChange={(value) => updateField("deviceRatio", value)}
                hoveredRating={hoveredRating.device}
                onHover={(value) =>
                  setHoveredRating((prev) => ({ ...prev, device: value }))
                }
                label="장치 비중"
              />
              <RatingStars
                rating={extraFields.activityLevel || 0}
                onRatingChange={(value) => updateField("activityLevel", value)}
                hoveredRating={hoveredRating.activity}
                onHover={(value) =>
                  setHoveredRating((prev) => ({ ...prev, activity: value }))
                }
                label="활동성"
              />
            </div>
          </CardContent>
        </Card>

        {/* 운영 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">운영 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  오픈일
                </Label>
                <Input
                  type="date"
                  value={extraFields.openDate || ""}
                  onChange={(e) => updateField("openDate", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="font-medium">현재 운영중</Label>
                <Switch
                  checked={extraFields.isOperating ?? true}
                  onCheckedChange={(checked) => updateField("isOperating", checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {extraFields.isOperating ? "운영중" : "운영중단"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* URL 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">사이트 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">홈페이지 URL</Label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={extraFields.homepageUrl || ""}
                onChange={(e) => updateField("homepageUrl", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">예약 페이지 URL</Label>
              <Input
                type="url"
                placeholder="https://booking.example.com"
                value={extraFields.reservationUrl || ""}
                onChange={(e) => updateField("reservationUrl", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>



        {/* 매장 위치 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">매장 위치</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 기존 위치 목록 */}
            {extraFields.locations?.length > 0 && (
              <div className="space-y-3 mb-4">
                {extraFields.locations.map((location: EscapeRoomLocation, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 bg-muted/20 relative"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removeLocation(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="pr-8">
                      <h4 className="font-medium text-sm">{location.storeName}</h4>
                      <p className="text-sm text-muted-foreground">{location.address}</p>
                      {location.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {location.phone}
                        </p>
                      )}
                      {location.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {location.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 매장 검색 및 추가 */}
            <div className="border rounded-lg p-4 bg-background">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">매장 추가</h4>
                <Button
                  type="button"
                  onClick={() => setIsSearchModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  매장 검색
                </Button>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium mb-1">💡 매장 추가 방법:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>추천:</strong> 위의 "매장 검색" 버튼으로 네이버 지도에서 정확한 정보를 가져오기</li>
                  <li>• 또는 아래 폼에서 직접 입력하기</li>
                </ul>
              </div>

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm mb-1 block">매장명 *</Label>
                    <Input
                      placeholder="지점명 입력"
                      value={newLocation.storeName}
                      onChange={(e) =>
                        setNewLocation((prev) => ({ ...prev, storeName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">전화번호</Label>
                    <Input
                      placeholder="02-1234-5678"
                      value={newLocation.phone}
                      onChange={(e) =>
                        setNewLocation((prev) => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-1 block">주소 *</Label>
                  <Input
                    placeholder="매장 주소"
                    value={newLocation.address}
                    onChange={(e) =>
                      setNewLocation((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">도로명 주소</Label>
                  <Input
                    placeholder="도로명 주소 (선택사항)"
                    value={newLocation.roadAddress}
                    onChange={(e) =>
                      setNewLocation((prev) => ({ ...prev, roadAddress: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">설명</Label>
                  <Textarea
                    placeholder="매장 관련 추가 정보 (교통편, 주차장 등)"
                    value={newLocation.description}
                    onChange={(e) =>
                      setNewLocation((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  onClick={addLocation}
                  disabled={!newLocation.storeName.trim() || !newLocation.address.trim()}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  수동으로 매장 추가
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 매장 검색 모달 */}
      <EscapeRoomLocationSearchModal
        open={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        onSelect={handleLocationSelect}
      />
    </div>
  );
};

export default EscapeRoomFields;