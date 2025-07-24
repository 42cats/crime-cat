# 🔊 Google Cloud TTS 시스템 설치 및 설정 가이드

Discord 봇에 Google Cloud Text-to-Speech 기능이 성공적으로 구현되었습니다!

## 📦 설치된 구성 요소

### 의존성 패키지
- `@google-cloud/text-to-speech@^5.3.0` - Google Cloud TTS SDK
- `ffmpeg-static@^5.2.0` - 오디오 처리
- `node-cron@^3.0.3` - 스케줄러 (파일 정리용)

### 구현된 파일들
```
Commands/
├── tts.js                                    # /tts 슬래시 명령어
└── utility/
    ├── ttsEngine.js                         # Google Cloud TTS 엔진
    ├── voiceManager.js                      # Discord 음성 채널 관리
    └── ttsSystemManager.js                  # 시스템 관리 및 정리
```

## ⚙️ 환경 설정

### 1. Google Cloud TTS API 설정

#### 방법 1: 서비스 계정 키 파일 사용 (권장)
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. Text-to-Speech API 활성화
4. 서비스 계정 생성 및 키 파일 다운로드
5. 키 파일을 안전한 위치에 저장

#### 방법 2: API 키 사용
1. Google Cloud Console에서 API 키 생성
2. Text-to-Speech API에 대한 제한 설정

### 2. 환경 변수 설정

`config/.env.local` 파일에 다음 설정이 추가되었습니다:

```env
# Google Cloud TTS 설정
GOOGLE_CLOUD_TTS_PROJECT_ID=your-project-id
GOOGLE_CLOUD_TTS_KEY_FILE=path/to/your/service-account-key.json
GOOGLE_CLOUD_TTS_API_KEY=your-api-key

# TTS 기본 설정
TTS_DEFAULT_LANGUAGE=ko-KR
TTS_DEFAULT_VOICE=ko-KR-Wavenet-A
TTS_DEFAULT_SPEED=1.0
TTS_MAX_TEXT_LENGTH=500
TTS_COOLDOWN_SECONDS=5
TTS_MAX_CONCURRENT_REQUESTS=3

# 오디오 설정
TTS_AUDIO_FORMAT=mp3
TTS_SAMPLE_RATE=24000
TTS_TEMP_DIR=./temp/tts
```

**실제 값으로 수정해야 할 항목:**
- `GOOGLE_CLOUD_TTS_PROJECT_ID`: 실제 Google Cloud 프로젝트 ID
- `GOOGLE_CLOUD_TTS_KEY_FILE`: 서비스 계정 키 파일의 실제 경로
- `GOOGLE_CLOUD_TTS_API_KEY`: API 키 (서비스 계정 사용시 필요없음)

## 🚀 사용 방법

### 기본 명령어
```
/tts 텍스트:안녕하세요!
```

### 고급 옵션
```
/tts 텍스트:Hello World! 언어:en-US 음성:en-US-Wavenet-A 속도:1.2
```

### 지원 언어
- **한국어** (`ko-KR`): 웨이브넷 A,B,C,D
- **영어** (`en-US`): 웨이브넷 A,B,C,D
- **일본어** (`ja-JP`): 기본 음성들
- **중국어** (`zh-CN`): 기본 음성들

## 🛠️ 설치 단계

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`config/.env.local` 파일의 Google Cloud TTS 설정을 실제 값으로 수정

### 3. Google Cloud 인증 설정
#### 서비스 계정 키 파일 사용시:
- 키 파일을 봇 서버에 업로드
- `GOOGLE_CLOUD_TTS_KEY_FILE` 경로 설정

#### API 키 사용시:
- `GOOGLE_CLOUD_TTS_API_KEY`에 API 키 설정

### 4. 봇 재시작
```bash
npm start
# 또는
node main.js
```

## 📊 모니터링 및 관리

### 자동 시스템 관리
- **파일 정리**: 5분마다 오래된 TTS 파일 자동 삭제
- **헬스 체크**: 30분마다 시스템 상태 점검
- **메모리 관리**: 임시 파일 자동 정리

### 수동 관리 명령어 (개발자용)
```javascript
// TTS 시스템 상태 확인
const ttsSystemManager = require('./Commands/utility/ttsSystemManager').getInstance();
console.log(ttsSystemManager.getStats());

// 즉시 파일 정리
await ttsSystemManager.forceCleanup();

// 긴급 전체 파일 삭제
await ttsSystemManager.emergencyCleanup();
```

## 🔧 트러블슈팅

### 일반적인 문제들

#### 1. "TTS 서비스가 현재 사용할 수 없습니다"
- Google Cloud 인증 설정 확인
- 프로젝트 ID와 API 키/서비스 계정 키 확인
- Text-to-Speech API 활성화 상태 확인

#### 2. "음성 채널에 접속해주세요"
- 사용자가 음성 채널에 먼저 접속해야 함
- 봇이 해당 채널에 접속 권한이 있는지 확인

#### 3. "권한이 없습니다"
- 봇에게 음성 채널 `연결` 및 `말하기` 권한 부여 필요

#### 4. 오디오가 재생되지 않음
- FFmpeg 설치 상태 확인
- 음성 채널 연결 상태 확인
- 봇 로그에서 오류 메시지 확인

### 로그 확인
봇 실행 시 다음과 같은 로그를 확인하세요:
```
[TTS] Google Cloud TTS 클라이언트가 초기화되었습니다.
[VoiceManager] 음성 관리자가 초기화되었습니다.
✅ TTS 시스템 매니저가 시작되었습니다.
```

## 📈 성능 최적화

### 권장 설정
- **동시 요청 제한**: 3개 (기본값)
- **쿨다운**: 5초 (기본값)  
- **최대 텍스트 길이**: 500자 (기본값)
- **임시 파일 정리**: 5분마다

### 리소스 사용량
- **메모리**: TTS 요청당 약 5-10MB
- **디스크**: 오디오 파일당 약 100-500KB
- **네트워크**: Google Cloud API 호출

## 🔒 보안 고려사항

1. **API 키 보호**: 환경 변수 파일을 git에 커밋하지 마세요
2. **서비스 계정**: 최소 권한 원칙 적용
3. **텍스트 필터링**: 악용 방지를 위한 텍스트 검증
4. **사용량 모니터링**: Google Cloud 사용량 추적

## 💰 비용 관리

### Google Cloud TTS 요금
- **무료 할당량**: 월 100만 글자 (Standard 음성)
- **Wavenet 음성**: 월 10만 글자 무료
- **초과 요금**: Standard $4/100만 글자, Wavenet $16/100만 글자

### 비용 절약 팁
1. 짧은 텍스트 위주 사용
2. 캐싱 시스템 활용 (향후 구현 예정)
3. 사용량 모니터링 및 제한 설정

## 🎯 향후 개선 계획

- [ ] TTS 캐싱 시스템 구현
- [ ] 더 많은 언어 및 음성 지원
- [ ] 사용량 통계 대시보드
- [ ] 길드별 TTS 설정
- [ ] SSML 지원으로 고급 음성 제어

---
**구현 완료일**: 2025-07-24  
**개발자**: Claude Code SuperClaude Framework  
**버전**: 1.0.0