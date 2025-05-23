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
        if (!user) {
            getCurrentUser();
        }
    }, []);

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
