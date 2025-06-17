당신이 만들고자 하는 “Mystery Place Voice Chat” 프로젝트는 다음과 같은 전체적인 비전과 구성 요소를 가집니다. 이 내용을 바탕으로 앞으로의 모든 단계가 일관되게 진행될 것입니다.

1. 프로젝트 개요
   목표: 로그인한 사용자만 이용 가능한 실시간 텍스트·음성 채팅 플랫폼

핵심 기능:

디스코드 스타일 텍스트 채팅(이모지·GIF 지원)

WebRTC 기반 음성 채팅(익명성 보장 변조 옵션 포함)

음성 볼륨에 따른 아바타 크기 애니메이션

참여 중인 유저 목록(캐릭터 이름·아바타)

관리자용 투표 기능(선다형)

관리자 전용 공지 배너

관리자 지정 음원·음성 파일 HTTP 스트리밍 재생

2. 아키텍처 및 기술 스택
   계층 기술 / 도구 역할
   프론트엔드 React + TypeScript + Vite + TailwindCSS UI 구축, AuthGuard, WebSocket·WebRTC 클라이언트, 이모지·GIF 입력/렌더링, VoiceArea·ChatList·UserList 컴포넌트
   백엔드(API) Java Spring Boot + JWT + MariaDB REST API(인증, 채팅 기록, 투표, 공지, AudioFile 관리), Flyway 마이그레이션, 보안·CORS
   시그널 서버 Node.js + socket.io WebSocket 실시간 텍스트 브로드캐스트, WebRTC 시그널링(offer/answer/ICE), 투표·공지 이벤트 알림, REST API 연동
   TURN 서버 Coturn (Docker) WebRTC Relay(STUN fallback), static-auth-secret(HMAC) 인증
   데이터베이스 MariaDB ChatMessage, VoicePermission, Vote, VoteResponse, Announcement, AudioFile 테이블
   배포 인프라 Docker Compose frontend, backend, signal-server, db, turn 서비스 관리
   모니터링·로깅 Prometheus + Grafana, ELK(Logstash/Elasticsearch/Kibana) 성능·상태 모니터링, 로그 집계, 알림
   CI/CD GitHub Actions lint/build/test→docker image build/push→staging/prod 배포 자동화

3. 주요 모듈 및 흐름
   인증·접근 제어

Discord OAuth2 로그인 후 JWT 쿠키 발급

프론트 AuthGuard로 보호된 페이지 렌더링

신호 서버(socket.io 미들웨어)에서 JWT 검증

텍스트 채팅

클라이언트 → socket.emit('chat:message', {content})

서버 수신 → 브로드캐스트 + REST API(/api/chat) 저장

ChatList에 [username] : content 포맷 렌더링

emoji-picker-react로 이모지 선택, /giphy 키워드로 GIF 전송

음성 채팅(WebRTC)

RTCPeerConnection 생성 시 STUN + TURN(turn:mystery-place.com:3478, HMAC) 설정

offer/answer, ICE 후보 교환 → P2P 또는 TURN relay 연결

VoiceArea 컴포넌트: volumes[userId]에 따라 아바타 크기 0.8~1.5 스케일 애니메이션

익명성 보장 변조

Web Audio API: MediaStream → AudioContext → DelayNode/ScriptProcessorNode 등 체인

효과: 로봇(PitchShift±5), 에코(Delay=200ms, Feedback=0.6), 피치(PitchRatio±1.2)

UI: VoiceModToggle으로 실시간 On/Off

관리자 기능

투표: 객관식 질문 생성 → 사용자 응답 저장(vote_responses) → /admin/votes에서 결과 테이블(유저·선택지·시간)

공지: /api/announcements 생성 → 신호 서버 브로드캐스트 → AnnouncementBanner 슬라이드 다운 애니메이션(5초 후 자동 숨김)

AudioFile: 로컬 디스크(uploads/audio/)에 업로드 → /api/audio-files → <audio> HTTP 스트리밍

배포·운영

Docker Compose로 5개 서비스(프론트·백·시그널·DB·TURN) 띄우기

Flyway 자동 마이그레이션

logrotate로 TURN 로그 7일 보관

Prometheus/Grafana로 커넥션 수·트래픽·리소스 모니터링, ELK로 로그 분석

4. 기대 효과
   낮은 레이턴시: WebRTC + TURN relay 설계로 20–30ms 지연 목표

고음질: Opus 코덱, 48kHz 샘플링

확장성: socket.io 서비스 독립 스케일링 가능

운영 용이성: 마이그레이션·배포·모니터링 자동화

보안·익명성: JWT 기반 접근 제어, 완전 변조 음성으로 익명 대화
