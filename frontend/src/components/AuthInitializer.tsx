import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { registerSetUser } from "@/utils/authUtils";
import { userState } from "@/atoms/auth";
import { useAuth } from "@/hooks/useAuth";
import BlockedUserModal from "@/components/auth/BlockedUserModal";

const AuthInitializer = () => {
    const { user, getCurrentUser, blockInfo, isBlocked } = useAuth();
    const setUser = useSetRecoilState(userState);
    const [showBlockModal, setShowBlockModal] = useState(false);

    registerSetUser(setUser);

    useEffect(() => {
        // 최초 한 번만 사용자 정보를 가져오도록 수정
        getCurrentUser();
    }, []); // 빈 의존성 배열로 변경

    useEffect(() => {
        if (isBlocked && blockInfo && user) {
            setShowBlockModal(true);
        }
    }, [isBlocked, blockInfo, user]);

    return (
        <>
            {blockInfo && (
                <BlockedUserModal
                    isOpen={showBlockModal}
                    blockInfo={blockInfo}
                    onClose={() => {
                        setShowBlockModal(false);
                        // 차단된 사용자는 로그아웃 처리
                        window.location.href = "/";
                    }}
                />
            )}
        </>
    );
};

export default AuthInitializer;
