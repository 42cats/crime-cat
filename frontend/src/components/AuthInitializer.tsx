import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { registerSetUser } from "@/utils/authUtils";
import { userState } from "@/atoms/auth";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/useAppStore";
import BlockedUserModal from "@/components/auth/BlockedUserModal";

const AuthInitializer = () => {
    const { user, getCurrentUser, blockInfo, isBlocked } = useAuth();
    const setUser = useSetRecoilState(userState);
    const { setCurrentUser } = useAppStore();
    const [showBlockModal, setShowBlockModal] = useState(false);

    registerSetUser(setUser);

    useEffect(() => {
        // 최초 한 번만 사용자 정보를 가져오도록 수정
        getCurrentUser();
    }, []); // 빈 의존성 배열로 변경

    // Recoil userState와 Zustand useAppStore 동기화
    useEffect(() => {
        if (user) {
            console.log('🔄 사용자 정보 동기화: Recoil → Zustand', user);
            setCurrentUser({
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.profileUrl
            });
        } else {
            console.log('🔄 사용자 정보 초기화: Zustand');
            setCurrentUser(undefined);
        }
    }, [user, setCurrentUser]);

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
