import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle } from "lucide-react";

interface BlockUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, expiresAt?: string) => void;
    userNickname: string;
    loading?: boolean;
}

const BlockUserModal: React.FC<BlockUserModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    userNickname,
    loading = false,
}) => {
    const [blockType, setBlockType] = useState<"permanent" | "temporary">("permanent");
    const [reason, setReason] = useState("");
    const [duration, setDuration] = useState("1");
    const [unit, setUnit] = useState<"hours" | "days" | "weeks">("days");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!reason.trim()) {
            alert("차단 사유를 입력해주세요.");
            return;
        }

        let expiresAt: string | undefined;
        
        if (blockType === "temporary") {
            const durationNum = parseInt(duration);
            if (isNaN(durationNum) || durationNum <= 0) {
                alert("올바른 차단 기간을 입력해주세요.");
                return;
            }

            const now = new Date();
            switch (unit) {
                case "hours":
                    now.setHours(now.getHours() + durationNum);
                    break;
                case "days":
                    now.setDate(now.getDate() + durationNum);
                    break;
                case "weeks":
                    now.setDate(now.getDate() + (durationNum * 7));
                    break;
            }
            expiresAt = now.toISOString();
        }

        onConfirm(reason, expiresAt);
    };

    const handleClose = () => {
        setReason("");
        setBlockType("permanent");
        setDuration("1");
        setUnit("days");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-destructive">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        사용자 차단
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-destructive/10 p-3 rounded-lg">
                        <p className="text-sm">
                            <strong>{userNickname}</strong> 사용자를 차단하시겠습니까?
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="reason">차단 사유 *</Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="차단 사유를 입력해주세요..."
                                rows={3}
                                required
                            />
                        </div>

                        <div>
                            <Label>차단 유형</Label>
                            <RadioGroup
                                value={blockType}
                                onValueChange={(value) => setBlockType(value as "permanent" | "temporary")}
                                className="mt-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="permanent" id="permanent" />
                                    <Label htmlFor="permanent">영구 차단</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="temporary" id="temporary" />
                                    <Label htmlFor="temporary">기간 제한 차단</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {blockType === "temporary" && (
                            <div className="flex space-x-2">
                                <div className="flex-1">
                                    <Label htmlFor="duration">기간</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min="1"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor="unit">단위</Label>
                                    <select
                                        id="unit"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value as "hours" | "days" | "weeks")}
                                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                    >
                                        <option value="hours">시간</option>
                                        <option value="days">일</option>
                                        <option value="weeks">주</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={loading}
                            >
                                {loading ? "처리 중..." : "차단하기"}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BlockUserModal;