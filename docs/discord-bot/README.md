# Discord 봇 개발 가이드

## 🎯 빠른 시작
```bash
npm start        # 봇 시작 (프로덕션)
npm run dev      # 봇 시작 (개발 모드)
npm test         # 테스트 실행
```

**권장 개발 환경**: VS Code + Node.js 18+ + Discord Developer Portal

## 🏗️ 아키텍처
- [Discord.js 구조](architecture/discordjs-structure.md) - 클라이언트, 이벤트, 명령어
- [음성 시스템](architecture/voice-system.md) - @discordjs/voice, 음성 채널 관리
- [데이터베이스 연동](architecture/database-integration.md) - Sequelize ORM, 모델 관리
- [백엔드 API 통합](architecture/backend-integration.md) - HTTP 클라이언트, 인증

## ⚙️ 핵심 기능
- [일정 관리 명령어](features/schedule-commands.md) ⭐ **최신 완성 (v2.0)**
- [음성 채널 관리](features/voice-management.md) - 음성 채팅, 음성 녹음
- [사용자 관리](features/user-management.md) - Discord ↔ Web 연동
- [광고 시스템](features/advertisement-system.md) - 자동 광고 송출

## 🎮 명령어 시스템
- [슬래시 명령어](commands/slash-commands.md) - Discord 슬래시 명령어 구현
- [일정 명령어](commands/schedule-commands.md) - `/내일정`, `/일정체크`, `/일정갱신`
- [음성 명령어](commands/voice-commands.md) - 음성 채널 제어 명령어
- [관리 명령어](commands/admin-commands.md) - 관리자 전용 명령어

## 🚀 API 연동
- [백엔드 API](api-integration/backend-api.md) ⚠️ **필수 패턴**
- [인증 시스템](api-integration/authentication.md) - Bearer Token 인증
- [실시간 통신](api-integration/realtime-communication.md) - Redis Pub/Sub
- [에러 처리](api-integration/error-handling.md) - Discord 에러 처리 전략

## 🔧 이벤트 처리
- [봇 이벤트](events/bot-events.md) - ready, messageCreate, interactionCreate
- [길드 이벤트](events/guild-events.md) - 서버 참가/탈퇴, 역할 변경
- [음성 이벤트](events/voice-events.md) - 음성 채널 참가/탈퇴, 상태 변경
- [커스텀 이벤트](events/custom-events.md) - 애플리케이션 이벤트

## 🎵 음성 시스템
- [음성 연결](voice/voice-connection.md) - 음성 채널 연결/해제
- [오디오 재생](voice/audio-playback.md) - 음성 파일 재생, 스트리밍
- [음성 녹음](voice/voice-recording.md) - 사용자 음성 녹음 기능
- [음성 품질](voice/audio-quality.md) - 음질 최적화, 지연 최소화

## 🗄️ 데이터 관리
- [Sequelize ORM](database/sequelize-orm.md) - 모델 정의, 관계 설정
- [데이터 동기화](database/data-sync.md) - 백엔드와 데이터 동기화
- [캐시 시스템](database/cache-system.md) - Redis 캐싱 전략
- [마이그레이션](database/migration.md) - 데이터베이스 스키마 변경

## 🔧 배포 및 운영
- [프로덕션 배포](deployment/production-deploy.md) - PM2, Docker 배포
- [모니터링](deployment/monitoring.md) - 로깅, 메트릭 수집
- [에러 추적](deployment/error-tracking.md) - 에러 로깅, 알림 시스템
- [성능 최적화](deployment/performance.md) - 메모리 사용량, 응답 시간

## 🆘 문제 해결
- [Discord API 이슈](troubleshooting/discord-api-issues.md) - Rate Limit, 권한 에러
- [음성 연결 문제](troubleshooting/voice-connection-issues.md) - 연결 끊김, 음질 문제
- [메모리 누수](troubleshooting/memory-leaks.md) - 메모리 사용량 최적화

## 📊 기술 스택

### Core
- **Discord.js v14.16.3** (Discord API 라이브러리)
- **Node.js 18+** (런타임)
- **@discordjs/voice** (음성 시스템)

### 데이터베이스
- **Sequelize** (ORM)
- **MariaDB** (데이터베이스)
- **Redis** (캐시 + Pub/Sub)

### HTTP & API
- **Axios** (HTTP 클라이언트)
- **Bearer Token** (백엔드 인증)

### 배포 & 운영
- **PM2** (프로세스 관리)
- **Docker** (컨테이너화)
- **Winston** (로깅)

## 🎯 개발 규칙

### 필수 규칙
1. **Bearer Token 인증**: 모든 백엔드 API 호출에 Bearer Token 사용
2. **에러 처리**: Discord 전용 ErrorStatus 사용 필수
3. **명령어 패턴**: SlashCommand 빌더 패턴 사용
4. **음성 안전성**: 음성 연결 해제 시 리소스 정리 필수
5. **비동기 처리**: Promise 기반 비동기 처리 패턴

### 코드 스타일
```javascript
// ✅ 올바른 명령어 패턴
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('내일정')
    .setDescription('나의 일정을 조회합니다')
    .addIntegerOption(option =>
      option.setName('months')
        .setDescription('조회할 개월 수 (1-12)')
        .setMinValue(1)
        .setMaxValue(12)
    ),

  async execute(interaction) {
    try {
      const months = interaction.options.getInteger('months') || 3;
      const discordSnowflake = interaction.user.id;

      const config = {
        headers: {
          'Authorization': `Bearer ${process.env.DISCORD_CLIENT_SECRET}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(
        `${process.env.API_BASE_URL}/bot/v1/schedule/user/${discordSnowflake}/my-schedule`,
        { ...config, params: { months } }
      );

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📅 내 일정')
        .setDescription(response.data.koreanDateFormat)
        .addFields(
          { name: '총 일정 수', value: `${response.data.totalEvents}개`, inline: true },
          { name: '조회 기간', value: `${months}개월`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('일정 조회 오류:', error);
      await interaction.reply('일정을 조회하는 중 오류가 발생했습니다.');
    }
  }
};
```

## 🔄 최신 업데이트 내용

### v2.0 완성 기능 (2025-08-28)
1. **일정 관리 명령어**: `/내일정`, `/일정체크`, `/일정갱신` 완성
2. **한국어 날짜 포맷**: "8월 28 29, 9월 3 4" 형식 지원
3. **실시간 iCal 동기화**: 백엔드 API 통합으로 30분 캐시 TTL
4. **완전한 예외 처리**: Discord 전용 ErrorStatus 10개 추가
5. **Bearer Token 인증**: 안전한 백엔드 API 통신

### 진행 예정 (Phase 8-10)
- 음성 명령어 확장
- 길드별 설정 관리
- 고급 스케줄 알림 기능

## 🔗 연관 서비스
- [백엔드 Bot API](../backend/api/bot-controllers.md)
- [프론트엔드 연동](../frontend/api-integration/discord-integration.md)
- [공통 API 계약](../shared/api-contracts.md)
- [배포 가이드](../shared/deployment.md)

## 🎮 주요 명령어 목록

### 일정 관리 명령어
- `/내일정 [months]` - 사용자 일정 조회 (1-12개월)
- `/일정체크 [dates] [months]` - 입력한 날짜와 일정 교차 확인
- `/일정갱신` - 캐시된 일정 데이터 강제 갱신

### 음성 관련 명령어
- `/참가` - 현재 음성 채널에 봇 참가
- `/나가기` - 음성 채널에서 봇 나가기
- `/음성녹음 시작` - 음성 녹음 시작
- `/음성녹음 정지` - 음성 녹음 정지

### 관리 명령어
- `/서버정보` - 서버 정보 표시
- `/사용자정보 [@user]` - 사용자 정보 표시
- `/공지 [message]` - 공지사항 전송 (관리자 전용)

## 🔗 연관 서비스
- [백엔드 Bot API](../backend/api/bot-controllers.md)
- [프론트엔드 연동](../frontend/api-integration/discord-integration.md)
- [공통 API 계약](../shared/api-contracts.md)
- [배포 가이드](../shared/deployment.md)