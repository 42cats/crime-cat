# 🚀 Code Refactoring Plan

코드 품질 개선을 위한 체계적인 리팩토링 계획서

## 📋 Overview

Copilot AI 코드 리뷰 결과를 바탕으로 한 3개 핵심 파일의 리팩토링 계획입니다.

| 파일 | 현재 상태 | 개선 목표 | 리스크 | 예상 작업량 |
|------|-----------|-----------|---------|-------------|
| `customVoteEnd.js` | 120줄 단일함수 | 3-4개 함수 분리 | 🟢 낮음 | 2-3시간 |
| `BotCommandExecutor.js` | 600줄 메서드 | 6-8개 메서드 분리 | 🟡 중간 | 4-6시간 |
| `ActionEditor.tsx` | 580줄 함수 | 10-15개 컴포넌트 분리 | 🔴 높음 | 6-8시간 |

---

## 🎯 Phase 1: customVoteEnd.js 리팩토링

### 현재 문제점
- `endVoteWithCustomRecipient` 함수가 120+ 줄
- 메타데이터 검증, 결과 집계, DM 전송이 하나의 함수에 혼재
- 단일 책임 원칙(SRP) 위반

### 개선 목표

#### Before
```javascript
async function endVoteWithCustomRecipient(client, voteId, message, dmRecipient, interaction) {
    // 120+ 줄의 모든 로직
}
```

#### After
```javascript
async function endVoteWithCustomRecipient(client, voteId, message, dmRecipient, interaction) {
    const metaData = await validateVoteMetadata(redis, voteId);
    if (!metaData) return;
    
    const voteResults = await aggregateVoteResults(redis, voteId, metaData);
    const formattedResults = formatVoteResults(voteResults, metaData);
    await sendResultNotification(dmRecipient, formattedResults, interaction);
}
```

### 분리할 함수들

1. **`validateVoteMetadata(redis, voteId)`**
   - 메타데이터 검증 및 조회
   - 에러 핸들링 및 로깅
   - 반환: 검증된 메타데이터 또는 null

2. **`aggregateVoteResults(redis, voteId, metaData)`**
   - Redis에서 투표 결과 집계
   - 옵션별 득표 수 계산
   - 반환: 집계된 투표 결과

3. **`formatVoteResults(results, metaData)`**
   - 결과를 사용자 친화적 형태로 포매팅
   - 퍼센트 계산 및 순위 정렬
   - 반환: 포매팅된 결과 문자열

4. **`sendResultNotification(recipient, results, interaction)`**
   - DM 또는 채널로 결과 전송
   - 에러 상황 처리 (DM 차단 등)
   - 반환: 전송 성공 여부

### 예상 효과
- ✅ 각 함수가 단일 책임 담당
- ✅ 테스트 용이성 대폭 향상
- ✅ 에러 핸들링 세분화 가능
- ✅ 재사용성 증대

---

## ⚙️ Phase 2: BotCommandExecutor.js 리팩토링

### 현재 문제점
- `createVirtualInteraction` 메서드가 600+ 줄
- 가상 인터랙션 생성, 옵션 처리, 응답 메서드가 모두 혼재
- 유지보수 및 디버깅 어려움

### 개선 목표

#### Before
```javascript
async createVirtualInteraction(context, commandName, parameters, targetChannelId, originalUserId, selectedSubcommand) {
    // 600+ 줄의 모든 로직
}
```

#### After
```javascript
async createVirtualInteraction(context, commandName, parameters, targetChannelId, originalUserId, selectedSubcommand) {
    const virtualUser = await this.resolveVirtualUser(context, originalUserId);
    const executionChannel = this.resolveExecutionChannel(context, targetChannelId);
    const optionsHandler = this.createOptionsHandler(parameters, selectedSubcommand);
    const responseHandler = this.createResponseHandler(executionChannel);
    
    return this.buildVirtualInteraction(
        context, 
        commandName, 
        virtualUser, 
        executionChannel, 
        optionsHandler, 
        responseHandler
    );
}
```

### 분리할 메서드들

1. **`resolveVirtualUser(context, originalUserId)`**
   - 가상 사용자 해결 로직
   - 커스텀투표 등 특수 케이스 처리
   - 반환: 해결된 Discord User 객체

2. **`resolveExecutionChannel(context, targetChannelId)`**
   - 실행 채널 결정 로직
   - 채널 권한 확인
   - 반환: Discord Channel 객체

3. **`createOptionsHandler(parameters, selectedSubcommand)`**
   - 커맨드 옵션 처리기 생성
   - 서브커맨드 지원
   - 타입 변환 및 검증 로직
   - 반환: options 객체

4. **`createResponseHandler(executionChannel)`**
   - 응답 처리기 생성
   - 응답 상태 추적
   - 반환: response handler 객체

5. **`createCommandOptions(parameters)`**
   - 개별 커맨드 옵션 생성
   - getString, getNumber, getBoolean 등
   - 반환: 옵션 메서드들

6. **`createResponseMethods(executionChannel, responses)`**
   - reply, editReply, followUp 메서드 생성
   - 실제 Discord 메시지 전송
   - 반환: 응답 메서드들

7. **`buildVirtualInteraction(...)`**
   - 최종 가상 인터랙션 조립
   - 모든 컴포넌트 통합
   - 반환: 완성된 virtual interaction

### 예상 효과
- ✅ 각 메서드가 명확한 역할 담당
- ✅ 디버깅 및 로깅 세분화
- ✅ 새로운 기능 추가 시 영향 범위 최소화
- ✅ 코드 재사용성 향상

---

## 🎨 Phase 3: ActionEditor.tsx 리팩토링

### 현재 문제점
- `renderActionParameters` 함수가 580+ 줄
- 모든 액션 타입 렌더링이 하나의 함수에 집중
- React 컴포넌트 설계 모범 사례 위반

### 개선 목표

#### Before
```typescript
const renderActionParameters = (action: ActionConfig, index: number) => {
    // 580+ 줄의 모든 렌더링 로직
};
```

#### After
```typescript
const renderActionParameters = (action: ActionConfig, index: number) => {
    const parameterRenderers = {
        'execute_bot_command': BotCommandParameterEditor,
        'add_role': RoleParameterEditor,
        'send_message': MessageParameterEditor,
        'play_music': MusicParameterEditor,
        'grant_server_permission': PermissionParameterEditor,
        'set_channel_permission': ChannelPermissionParameterEditor,
        // ... 기타 액션 타입들
    };
    
    const ParameterEditor = parameterRenderers[action.type] || DefaultParameterEditor;
    return (
        <ParameterEditor 
            action={action} 
            index={index} 
            onUpdate={updateActionParameter}
            channels={channels}
            roles={roles}
            botCommands={botCommands}
        />
    );
};
```

### 분리할 컴포넌트들

#### Core Components

1. **`BotCommandParameterEditor.tsx`**
   ```typescript
   interface BotCommandParameterEditorProps {
       action: ActionConfig;
       index: number;
       onUpdate: (index: number, key: string, value: any) => void;
       botCommands: BotCommand[];
   }
   ```
   - 봇 커맨드 액션 전용 에디터
   - 커맨드 선택 드롭다운
   - 서브커맨드 탭 인터페이스
   - 파라미터 입력 폼

2. **`RoleParameterEditor.tsx`**
   - 역할 추가/제거 액션 에디터
   - 역할 선택 드롭다운
   - 대상 사용자 선택

3. **`MessageParameterEditor.tsx`**
   - 메시지 전송 액션 에디터
   - 채널 선택
   - 메시지 내용 입력
   - 임베드 옵션

4. **`PermissionParameterEditor.tsx`**
   - 권한 관련 액션 에디터
   - 권한 카테고리 분류
   - 채널 타입별 권한 필터링

#### Specialized Components

5. **`ChannelParameterEditor.tsx`**
   - 채널 관련 액션 에디터
   - 채널 타입 필터링
   - 권한 검증

6. **`UserParameterEditor.tsx`**
   - 사용자 관련 액션 에디터
   - 사용자 선택 인터페이스
   - 역할 기반 필터링

7. **`DelayParameterEditor.tsx`**
   - 지연 시간 설정 에디터
   - 시간 단위 변환
   - 유효성 검증

#### Utility Components

8. **`CommonParameterComponents/`**
   - `TargetSelector.tsx` - 대상 선택 공통 컴포넌트
   - `DelayInput.tsx` - 지연 시간 입력
   - `VisibilitySelector.tsx` - 결과 표시 옵션
   - `PermissionCategorySelector.tsx` - 권한 카테고리 선택

### 컴포넌트 인터페이스 표준화

```typescript
interface BaseParameterEditorProps {
    action: ActionConfig;
    index: number;
    onUpdate: (index: number, key: string, value: any) => void;
}

interface ExtendedParameterEditorProps extends BaseParameterEditorProps {
    channels?: Channel[];
    roles?: Role[];
    botCommands?: BotCommand[];
    permissions?: Permission[];
}
```

### 예상 효과
- ✅ 각 컴포넌트가 특정 액션 타입에 특화
- ✅ 재사용성 및 테스트 용이성 향상
- ✅ React 성능 최적화 가능 (React.memo, useMemo)
- ✅ 새로운 액션 타입 추가 시 독립적 개발 가능
- ✅ 코드 스플리팅으로 번들 크기 최적화

---

## 📈 Implementation Roadmap

### Phase 1: 저위험 개선 (1-2주)
**목표**: `customVoteEnd.js` 리팩토링

**Week 1**
- [ ] `validateVoteMetadata` 함수 분리
- [ ] `aggregateVoteResults` 함수 분리
- [ ] 기존 기능 테스트 및 검증

**Week 2**
- [ ] `formatVoteResults` 함수 분리
- [ ] `sendResultNotification` 함수 분리
- [ ] 통합 테스트 및 배포

**완료 기준**
- ✅ 모든 기존 테스트 통과
- ✅ 새로운 단위 테스트 작성
- ✅ 코드 복잡도 50% 감소

### Phase 2: 중위험 개선 (2-3주)
**목표**: `BotCommandExecutor.js` 리팩토링

**Week 1**
- [ ] `resolveVirtualUser` 메서드 분리
- [ ] `resolveExecutionChannel` 메서드 분리
- [ ] 기본 기능 검증

**Week 2**
- [ ] `createOptionsHandler` 메서드 분리
- [ ] `createResponseHandler` 메서드 분리
- [ ] 서브커맨드 기능 테스트

**Week 3**
- [ ] `createCommandOptions` 메서드 분리
- [ ] `createResponseMethods` 메서드 분리
- [ ] `buildVirtualInteraction` 메서드 분리
- [ ] 통합 테스트 및 성능 검증

**완료 기준**
- ✅ 봇 커맨드 실행 기능 정상 동작
- ✅ 서브커맨드 탭 기능 정상 동작
- ✅ 가상 인터랙션 생성 성능 유지

### Phase 3: 고위험 개선 (3-4주)
**목표**: `ActionEditor.tsx` 리팩토링

**Week 1**
- [ ] `BotCommandParameterEditor` 컴포넌트 생성
- [ ] `RoleParameterEditor` 컴포넌트 생성
- [ ] A/B 테스트 환경 구축

**Week 2**
- [ ] `MessageParameterEditor` 컴포넌트 생성
- [ ] `PermissionParameterEditor` 컴포넌트 생성
- [ ] 사용자 피드백 수집

**Week 3**
- [ ] 나머지 전문 컴포넌트들 생성
- [ ] 공통 컴포넌트 라이브러리 구축
- [ ] 성능 최적화 (React.memo, useMemo)

**Week 4**
- [ ] 기존 코드 완전 대체
- [ ] 회귀 테스트 전체 수행
- [ ] 사용자 경험 검증

**완료 기준**
- ✅ 모든 액션 타입 정상 렌더링
- ✅ 사용자 인터페이스 반응 속도 향상
- ✅ 번들 크기 최적화 (코드 스플리팅)

---

## 🛡️ Risk Mitigation Strategy

### 기능 플래그 시스템
```typescript
const useRefactoredComponents = process.env.REACT_APP_USE_REFACTORED === 'true';

const renderActionParameters = (action: ActionConfig, index: number) => {
    if (useRefactoredComponents) {
        return renderRefactoredActionParameters(action, index);
    } else {
        return renderLegacyActionParameters(action, index);
    }
};
```

### 단계적 롤아웃
1. **개발 환경**: 새 구조 테스트
2. **스테이징 환경**: 통합 테스트
3. **프로덕션 A/B**: 일부 사용자 대상
4. **전체 롤아웃**: 안정성 확인 후

### 자동화 테스트 강화
```yaml
test_strategy:
  unit_tests:
    - 각 분리된 함수/컴포넌트별 테스트
    - 커버리지 80% 이상 목표
  
  integration_tests:
    - 기존 기능 회귀 테스트
    - 사용자 시나리오 기반 E2E 테스트
  
  performance_tests:
    - 렌더링 성능 벤치마크
    - 메모리 사용량 모니터링
```

### 롤백 계획
- **즉시 롤백**: 기능 플래그로 이전 버전 활성화
- **데이터 호환성**: 기존 데이터 구조 유지
- **모니터링**: 에러율, 성능 지표 실시간 추적

---

## 📊 Success Metrics

### 코드 품질 지표
- **순환 복잡도**: 50% 감소 목표
- **함수 길이**: 평균 50줄 이하
- **파일 크기**: 평균 300줄 이하
- **중복 코드**: 10% 이하

### 개발 생산성 지표
- **새 기능 개발 시간**: 30% 단축
- **버그 수정 시간**: 40% 단축
- **테스트 작성 시간**: 50% 단축
- **코드 리뷰 시간**: 20% 단축

### 사용자 경험 지표
- **페이지 로딩 시간**: 20% 향상
- **UI 반응 속도**: 30% 향상
- **번들 크기**: 15% 감소
- **에러 발생률**: 50% 감소

### 유지보수성 지표
- **새 개발자 온보딩 시간**: 40% 단축
- **기능 추가 시 영향 범위**: 60% 감소
- **문서화 커버리지**: 90% 이상
- **자동화 테스트 커버리지**: 80% 이상

---

## 🔧 Development Guidelines

### 코딩 표준
- **함수 크기**: 최대 50줄 권장
- **단일 책임**: 하나의 함수는 하나의 일만
- **순수 함수**: 사이드 이펙트 최소화
- **타입 안전성**: TypeScript 엄격 모드 사용

### 문서화 규칙
- **JSDoc**: 모든 public 함수/메서드
- **README**: 각 컴포넌트별 사용법
- **CHANGELOG**: 주요 변경사항 기록
- **Migration Guide**: 기존 코드 마이그레이션 가이드

### 테스트 전략
- **테스트 우선**: TDD 방식 권장
- **Mock 최소화**: 실제 동작 테스트 우선
- **Edge Case**: 경계 조건 테스트 필수
- **Performance**: 성능 회귀 테스트 포함

---

## 📅 Timeline Summary

| Phase | Duration | Focus | Risk Level | Expected Outcome |
|-------|----------|-------|------------|------------------|
| Phase 1 | 1-2 weeks | customVoteEnd.js | 🟢 Low | Function separation, improved testability |
| Phase 2 | 2-3 weeks | BotCommandExecutor.js | 🟡 Medium | Method separation, better maintainability |
| Phase 3 | 3-4 weeks | ActionEditor.tsx | 🔴 High | Component separation, enhanced UX |
| **Total** | **6-9 weeks** | **Complete refactoring** | **Managed** | **50% complexity reduction** |

---

## 🚀 Getting Started

### Prerequisites
- [ ] 현재 시스템 안정성 확보
- [ ] 자동화 테스트 환경 구축
- [ ] 기능 플래그 시스템 구현
- [ ] 개발팀 리팩토링 계획 공유

### First Steps
1. **Phase 1 시작**: `customVoteEnd.js` 분석
2. **테스트 작성**: 기존 기능 동작 검증
3. **함수 분리**: 단계적 리팩토링 진행
4. **검증 및 배포**: 안정성 확인 후 다음 단계

---

*이 문서는 코드 품질 개선을 위한 로드맵입니다. 각 단계별로 충분한 테스트와 검증을 거쳐 안전하게 진행하시기 바랍니다.*