import React from "react";

const TermsPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-sm md:text-base leading-7">
            <h1 className="text-3xl font-bold mb-6">개인정보 처리방침</h1>
            <p className="text-muted-foreground mb-4">
                최종 수정일: 2025-04-27
            </p>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">
                    1. 수집하는 개인정보 항목
                </h2>
                <ul className="list-disc list-inside mb-2">
                    <li>디스코드 고유 식별자(ID)</li>
                    <li>사용자명 및 태그</li>
                    <li>프로필 사진 URL</li>
                    <li>이메일(선택적 수집)</li>
                    <li>가입일, 마지막 로그인 시각, 포인트 및 활동 기록</li>
                </ul>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">
                    2. 개인정보 수집 방법
                </h2>
                <p>
                    디스코드 OAuth 인증을 통한 자동 수집 및 서비스 이용 중
                    생성되는 기록을 통해 수집합니다.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">
                    3. 개인정보 이용 목적
                </h2>
                <ul className="list-disc list-inside mb-2">
                    <li>서비스 제공 및 본인 인증</li>
                    <li>포인트 및 권한 관리</li>
                    <li>서비스 개선 및 신규 기능 개발</li>
                    <li>법적 의무 준수 및 민원 처리</li>
                </ul>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">
                    4. 개인정보 보관 및 파기
                </h2>
                <p>
                    회원 탈퇴 시 지체 없이 개인정보를 파기하며, 법령에 따라
                    보관이 필요한 경우 별도로 보관 후 안전하게 삭제합니다.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">
                    5. 개인정보 제공 및 위탁
                </h2>
                <p>
                    회사는 개인정보를 외부에 제공하거나 위탁하지 않습니다. 단,
                    법령에 근거하거나 회원 동의 시 예외적으로 제공할 수
                    있습니다.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">
                    6. 회원의 권리와 행사 방법
                </h2>
                <p>
                    회원은 개인정보 조회, 수정 및 삭제 요청을 할 수 있으며,
                    서비스 내 회원 탈퇴 기능을 통해 직접 탈퇴할 수 있습니다.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">7. 책임 제한</h2>
                <ul className="list-disc list-inside mb-2">
                    <li>
                        회원의 과실로 인한 개인정보 유출에 대해 회사는 책임을
                        지지 않습니다.
                    </li>
                    <li>
                        디스코드 플랫폼의 문제로 인한 정보 유출에 대해 회사는
                        책임을 지지 않습니다.
                    </li>
                </ul>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">
                    8. 개인정보 보호를 위한 조치
                </h2>
                <ul className="list-disc list-inside mb-2">
                    <li>개인정보 암호화 저장</li>
                    <li>최소 권한 접근 통제</li>
                    <li>서버 보안 강화 및 접근 기록 관리</li>
                    <li>정기적인 보안 점검 실시</li>
                </ul>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-2">
                    9. 개인정보 보호책임자
                </h2>
                <p>
                    이름: 변상훈 <br />
                    이메일: hoone0802@mystery-place.com
                </p>
            </section>

            <div className="mt-12 text-center font-semibold text-muted-foreground">
                본 방침은 디스코드 OAuth 인증 및 서비스 이용 시 자동으로 동의한
                것으로 간주합니다.
            </div>
        </div>
    );
};

export default TermsPage;
