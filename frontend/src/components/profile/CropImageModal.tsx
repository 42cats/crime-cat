import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";
import { cn } from "@/lib/utils";

interface CropImageModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  previewUrl: string | null;
  crop: { x: number; y: number };
  zoom: number;
  setCrop: (crop: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
  applyCroppedImage: () => Promise<void>;
  isDark: boolean;
}

/**
 * 프로필 이미지 크롭 모달 컴포넌트
 */
const CropImageModal: React.FC<CropImageModalProps> = ({
  showModal,
  setShowModal,
  previewUrl,
  crop,
  zoom,
  setCrop,
  setZoom,
  onCropComplete,
  applyCroppedImage,
  isDark,
}) => {
  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>프로필 이미지 편집</DialogTitle>
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
        <div className="py-4">
          <div className="flex items-center justify-between mb-2">
            <Label>확대/축소</Label>
            <span className="text-xs text-muted-foreground">{zoom.toFixed(1)}x</span>
          </div>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(value) => setZoom(value[0])}
            className={cn(
              isDark ? "[&_[role=slider]]:bg-indigo-500" : "[&_[role=slider]]:bg-indigo-600"
            )}
          />
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowModal(false)}
            className="sm:flex-1"
          >
            취소
          </Button>
          <Button
            onClick={applyCroppedImage}
            className={cn(
              "sm:flex-1",
              isDark ? "bg-indigo-600 hover:bg-indigo-700" : ""
            )}
          >
            적용하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CropImageModal;
