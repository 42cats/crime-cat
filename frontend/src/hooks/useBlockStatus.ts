import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { BlockInfo } from "@/types/user";

export const useBlockStatus = () => {
    const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkBlockStatus = async () => {
        try {
            setLoading(true);
            const response = await adminApi.userManagement.getCurrentUserBlockStatus();
            const blockData: BlockInfo = response.data;
            
            setBlockInfo(blockData);
            setIsBlocked(blockData.isBlocked);
            
            // 차단 기간이 만료된 경우 자동으로 차단 해제
            if (blockData.isBlocked && blockData.blockExpiresAt) {
                const expiryDate = new Date(blockData.blockExpiresAt);
                const now = new Date();
                
                if (now > expiryDate) {
                    setIsBlocked(false);
                    setBlockInfo({ ...blockData, isBlocked: false });
                }
            }
        } catch (error) {
            console.error("차단 상태 확인 중 오류:", error);
            setIsBlocked(false);
            setBlockInfo(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkBlockStatus();
    }, []);

    return {
        blockInfo,
        isBlocked,
        loading,
        refetch: checkBlockStatus,
    };
};