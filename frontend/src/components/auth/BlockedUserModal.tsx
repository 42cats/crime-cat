import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Shield } from "lucide-react";
import { BlockInfo } from "@/types/user";

interface BlockedUserModalProps {
    isOpen: boolean;
    blockInfo: BlockInfo;
    onClose: () => void;
}

const BlockedUserModal: React.FC<BlockedUserModalProps> = ({
    isOpen,
    blockInfo,
    onClose,
}) => {
    const formatBlockExpiry = () => {
        if (!blockInfo.blockExpiresAt) {
            return "영구 차단";
        }
        
        const expiryDate = new Date(blockInfo.blockExpiresAt);
        const now = new Date();
        
        if (expiryDate < now) {
            return "차단 기간 만료";
        }
        
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        
        if (diffDays > 1) {
            return `${diffDays}일 후 해제 (${expiryDate.toLocaleDateString()})`;
        } else if (diffHours > 1) {
            return `${diffHours}시간 후 해제`;
        } else {
            return "곧 해제 예정";
        }
    };

    const getIcon = () => {
        if (blockInfo.isPermanent) {
            return <Shield className="h-8 w-8 text-red-500" />;
        }
        return <Clock className="h-8 w-8 text-orange-500" />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-destructive">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        계정 차단 알림
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                        {getIcon()}
                    </div>
                    
                    <div className="bg-destructive/10 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">
                            귀하의 계정이 차단되었습니다
                        </h3>
                        
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-medium">차단 사유:</span>
                                <p className="mt-1 text-gray-700 dark:text-gray-300">
                                    {blockInfo.blockReason || "사유가 명시되지 않았습니다."}
                                </p>
                            </div>
                            
                            {blockInfo.blockedAt && (
                                <div>
                                    <span className="font-medium">차단 시작:</span>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {new Date(blockInfo.blockedAt).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            
                            <div>
                                <span className="font-medium">차단 해제:</span>
                                <p className={`font-medium ${
                                    blockInfo.isPermanent ? "text-red-600" : "text-orange-600"
                                }`}>
                                    {formatBlockExpiry()}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>
                            문의사항이 있으시면 관리자에게 연락해주세요.
                        </p>
                    </div>
                    
                    <Button onClick={onClose} className="w-full">
                        확인
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BlockedUserModal;