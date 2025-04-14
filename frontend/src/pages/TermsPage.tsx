import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-sm md:text-base leading-7">
      <h1 className="text-3xl font-bold mb-6">디스코드 봇 서비스 이용 약관</h1>
      <p className="text-muted-foreground mb-4">최종 수정일: 2025-01-24</p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">1. 개요</h2>
        <p>
          본 약관은 디스코드 봇 및 관련 서비스(이하 &quot;서비스&quot;)를 이용하는 디스코드 사용자(이하 &quot;사용자&quot;)와
          길드 관리자 및 구성원(이하 &quot;길드&quot;)에 적용됩니다. 서비스를 이용함으로써, 사용자는 본 약관에 동의한 것으로 간주됩니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">2. 데이터 수집 및 사용</h2>
        <p className="mb-2 font-medium">1) 수집 데이터:</p>
        <ul className="list-disc list-inside mb-2">
          <li>길드 정보(길드 이름, ID, 소유자 ID, 생성 날짜 등)</li>
          <li>길드 멤버 정보(사용자 ID, 닉네임, 활동 내역 등)</li>
          <li>서비스 이용 기록(명령어 사용 내역, 상호작용 기록 등)</li>
        </ul>
        <p className="mb-2 font-medium">2) 데이터 사용 목적:</p>
        <ul className="list-disc list-inside mb-2">
          <li>디스코드 봇의 기능 제공 및 최적화</li>
          <li>맞춤형 서비스 제공</li>
          <li>상업적 목적의 분석 및 서비스 개선</li>
          <li>웹사이트 및 기타 플랫폼 연계</li>
        </ul>
        <p className="mb-2 font-medium">3) 상업적 활용:</p>
        <p>
          데이터는 광고, 분석, 유료 서비스 제공 등의 상업적 목적을 위해 활용될 수 있습니다. 사용자는 이에 명시적으로 동의해야 하며,
          동의하지 않을 경우 서비스 이용이 제한될 수 있습니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">3. 길드 권한 사용</h2>
        <p className="mb-2 font-medium">1) 필수 권한:</p>
        <p>
          봇은 메시지 읽기/쓰기, 멤버 관리, 채널 접근 등의 권한을 요청할 수 있으며,
          해당 권한은 오직 기능 수행을 위한 용도로만 사용됩니다.
        </p>
        <p className="mb-2 font-medium mt-4">2) 권한 철회:</p>
        <p>
          길드 관리자는 언제든지 권한을 철회할 수 있으며, 철회 시 일부 기능이 제한될 수 있습니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">4. 웹사이트 및 타 플랫폼 연계</h2>
        <p>
          서비스는 길드 및 사용자의 데이터를 외부 플랫폼에 연동하여 표시하거나 활용할 수 있으며,
          해당 데이터는 약관 및 개인정보 처리방침에 따라 보호됩니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">5. 사용자의 권리와 책임</h2>
        <ul className="list-disc list-inside mb-2">
          <li>데이터 열람 및 수정 요청 가능</li>
          <li>제3자 오용 방지를 위한 보호 조치</li>
          <li>디스코드 및 관련 플랫폼 정책 준수 의무</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">6. 면책 조항</h2>
        <ul className="list-disc list-inside mb-2">
          <li>사용자/길드의 부주의로 인한 문제에 대해 책임지지 않음</li>
          <li>외부 장애 또는 기술적 오류로 인한 데이터 손실 면책</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">7. 약관 변경</h2>
        <ul className="list-disc list-inside mb-2">
          <li>운영자는 필요 시 본 약관을 수정할 수 있으며, 변경 시 공지를 통해 고지함</li>
          <li>변경된 약관에 동의하지 않을 경우, 사용자는 서비스 이용 중단 가능</li>
        </ul>
      </section>

      <div className="mt-12 text-center font-semibold text-muted-foreground">
		위 약관은 봇 사용시에 자동으로 동의한것으로 간주합니다.
      </div>
    </div>
  );
};

export default TermsPage;
