import React from "react";
import { Mail, MessageCircle } from "lucide-react";

const ContactPage: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto px-6 py-20 text-sm md:text-base leading-7">
            <h1 className="text-3xl font-bold mb-6">문의하기</h1>
            <p className="mb-4 text-muted-foreground">
                짭냥이 디스코드 봇 또는 웹사이트 관련 문의가 있으시면 아래
                연락처로 편하게 연락 주세요.
            </p>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">📧 이메일 문의</h2>
                <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <a
                        href="mailto:byunsanghoon@mystery-place.com"
                        className="underline text-primary"
                    >
                        byunsanghoon@mystery-place.com
                    </a>
                </div>
                <p className="mt-2 text-muted-foreground">
                    버그 제보, 기능 제안, 데이터 삭제 요청 등을 포함한 모든
                    일반적인 문의를 이메일로 접수하실 수 있습니다.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">
                    💬 디스코드 DM 문의
                </h2>
                <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <p className="text-primary">
                        짭냥이 디스코드 봇으로 직접 DM 보내기
                    </p>
                </div>
                <p className="mt-2 text-muted-foreground">
                    디스코드 내에서 명령어 오류, 즉각적인 피드백, 간단한 요청
                    등을 DM을 통해 보낼 수 있습니다. 단, 디엠 허용이 되어 있어야
                    정상적으로 도달합니다.
                </p>
            </section>

            <div className="mt-12 text-center font-semibold text-muted-foreground">
                최대한 빠르게 확인 후 응답드리겠습니다. 감사합니다!
            </div>
        </div>
    );
};

export default ContactPage;
