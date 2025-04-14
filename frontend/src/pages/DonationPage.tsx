import React from "react";
import { Link } from "react-router-dom";

const DonationPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-sm md:text-base leading-7">
            <h1 className="text-3xl font-bold mb-6">🎗️ 냥이봇 후원 안내</h1>
            <p className="mb-8 text-muted-foreground font-medium">
                짭냥이를 후원하시고 포인트 혜택을 받아가세요!
            </p>

            {/* 후원 방법 */}
            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">💝 후원 방법</h2>
                <p className="mb-4">
                    냥이봇은 여러분의 후원으로 유지되고 발전합니다. 아래 방법을
                    통해 후원해 주시면 감사의 의미로 포인트 쿠폰을 보내드립니다.
                </p>
                <ul className="list-disc list-inside mb-6">
                    <li>
                        <strong>PC사용자:</strong> 아래 QR 코드를 스캔해주세요.
                    </li>
                    <li>
                        <strong>모바일 사용자:</strong> 버튼을 클릭하면
                        카카오페이 후원 페이지로 이동합니다.
                    </li>
                </ul>

                <div className="mb-4">
                    ✅ <strong>PC QR 코드</strong>
                    <br />
                    <img
                        src="/content/image/donation.JPG"
                        alt="카카오페이 QR 코드"
                        className="w-60 mt-2 rounded shadow-md"
                    />
                </div>

                <div className="mb-4">
                    ✅ <strong>모바일 후원</strong>
                    <br />
                    <a
                        href="https://qr.kakaopay.com/FRKk8VMnP"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                    >
                        👉 카카오페이 후원 페이지로 이동하기
                    </a>
                </div>

                <p className="mt-4 text-muted-foreground">
                    📌 후원 후 <strong>디스코드 짭냥이 봇에게 DM</strong>으로{" "}
                    <strong>입금자명</strong>을 알려주세요.
                    <br />
                    📌 확인 후 포인트 코드(32자리 영문+숫자)를 보내드립니다.
                </p>
            </section>

            {/* 리워드 포인트 안내 */}
            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">
                    🎟️ 리워드 포인트란?
                </h2>
                <p>
                    후원 금액에 따라 "포인트 코드"를 발급해드리며, 이를 통해
                    냥이봇의 고급 기능을 사용하실 수 있습니다.
                </p>
                <div className="mt-4 bg-muted p-4 rounded">
                    ✅ <strong>사용 방법:</strong>
                    <pre className="mt-2 bg-background p-2 rounded text-sm">
                        /코드사용 코드:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                    </pre>
                    ✅ <strong>예시:</strong>
                    <pre className="mt-2 bg-background p-2 rounded text-sm">
                        /코드사용 코드:3fa85f64-5717-4562-b3fc-2c963f66afa6
                    </pre>
                    ✅ <strong>응답 메시지:</strong>
                    <pre className="mt-2 bg-background p-2 rounded text-sm">
                        ✅ 코드가 성공적으로 등록되었습니다.\n현재 보유 포인트:
                        12,500
                    </pre>
                </div>

                <p className="mt-4 text-muted-foreground">
                    📌 이 코드는 타인에게 선물하거나 양도할 수 있습니다.
                </p>
            </section>

            {/* 후원 정책 안내 */}
            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">🔄 후원 정책</h2>
                <ul className="list-disc list-inside">
                    <li>현재는 전액 리워드 형식으로 포인트를 제공합니다.</li>
                    <li>
                        차후 유료 서비스가 도입될 경우, 기존 후원 내역은 그대로
                        혜택에 반영됩니다.
                    </li>
                    <li>
                        등급제 도입 시, 기존 후원자는 자동으로 높은 등급에
                        배정됩니다.
                    </li>
                </ul>
            </section>

            {/* 후원 후 절차 */}
            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">
                    🎯 후원 이후 절차
                </h2>
                <ol className="list-decimal list-inside space-y-2">
                    <li>카카오페이로 후원</li>
                    <li>
                        디스코드 <strong>짭냥이 봇에게 DM</strong>으로 입금자명
                        전송
                    </li>
                    <li>
                        확인 후 <strong>포인트 코드</strong> 수령
                    </li>
                    <li>
                        받은 코드를 <code>/코드사용</code> 명령어로 등록
                    </li>
                    <li>
                        <code>/권한업글</code> 명령어로 원하는 기능 활성화
                    </li>
                </ol>

                <p className="mt-4 text-muted-foreground">
                    📌 궁금한 점은{" "}
                    <Link to="/contact" className="underline text-primary">
                        문의하기
                    </Link>{" "}
                    페이지를 통해 언제든 연락 주세요.
                </p>
            </section>

            <div className="mt-12 text-center font-semibold text-muted-foreground">
                후원에 감사드리며, 냥이봇과 함께 더욱 즐거운 디스코드 생활을
                누려보세요! 🐾😺💖
            </div>
        </div>
    );
};

export default DonationPage;
