import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-sm md:text-base leading-7">
      <h1 className="text-3xl font-bold mb-6">개인정보 처리방침</h1>
      <p className="text-muted-foreground mb-4">최종 수정일: 2025-01-24</p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">1. 수집하는 정보</h2>
        <p>우리는 디스코드 사용자와 웹사이트 이용자의 정보를 다음과 같이 수집합니다:</p>
        <ul className="list-disc list-inside mt-2">
          <li>디스코드 사용자: ID(snowflake), 이름, 프로필 이미지, 알림 설정 여부, 포인트 등</li>
          <li>웹 사용자: 이메일, 암호화된 비밀번호, 닉네임, 역할, 로그인 시각 등</li>
          <li>길드 정보: 서버 ID, 이름, 소유자 ID 등</li>
          <li>음악, 게임 기록, 캐릭터, 쿠폰, 권한 관련 활동 내역</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">2. 수집 목적</h2>
        <ul className="list-disc list-inside">
          <li>디스코드 봇 서비스 제공 및 개인화</li>
          <li>웹사이트 기능 제공 (로그인, 대시보드 등)</li>
          <li>게임 기록, 음악 관리, 쿠폰 발행 등 커뮤니티 서비스 제공</li>
          <li>통계 및 서비스 개선 목적의 분석</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">3. 보관 및 보호</h2>
        <ul className="list-disc list-inside">
          <li>비밀번호는 해시 처리되어 저장되며 복호화되지 않습니다.</li>
          <li>UUID 기반 고유 식별자로 사용자 식별 및 보안 강화</li>
          <li>사용자가 계정을 비활성화하거나 탈퇴하면 관련 정보는 삭제되거나 비활성화 처리됩니다.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">4. 제3자 제공</h2>
        <p>우리는 사용자의 개인정보를 외부에 판매하거나 공유하지 않으며, 법적 요구가 있는 경우에만 제공합니다.</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">5. 사용자 권리</h2>
        <ul className="list-disc list-inside">
          <li>본인의 데이터에 대한 열람, 수정, 삭제 요청 가능</li>
          <li>요청은 이메일 또는 디스코드 피드백 채널을 통해 제출 가능</li>
        </ul>
      </section>

      <div className="mt-12 text-center font-semibold text-muted-foreground">
        본 방침은 사용자 동의 하에 효력이 발생하며, 필요 시 사전 공지 후 변경될 수 있습니다.
      </div>
    </div>
  );
};

export default PrivacyPage;
