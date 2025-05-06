# 프로필 관련 API 명세서

이 문서는 프로필 관련 API의 요청 및 응답 형식을 설명합니다.

## 기본 URL

```
/api
```

## 공통 응답 형식

모든 API 응답은 다음 형식을 따릅니다:

### 성공 응답

```json
{
  "success": true,
  "data": { ... }
}
```

### 실패 응답

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

## API 목록

## 1. 프로필 정보

### 1.1 프로필 정보 조회 API

**요청**

```
GET /users/{userId}/profile
```

**응답**

```json
{
  "success": true,
  "data": {
    "id": "user123",
    "nickname": "사용자",
    "bio": "자기소개",
    "badge": "개발자",
    "avatar": "https://example.com/avatar.jpg",
    "social_links": {
      "instagram": "https://instagram.com/user",
      "x": "https://x.com/user",
      "openkakao": "https://open.kakao.com/o/abcdef"
    }
  }
}
```

### 1.2 프로필 업데이트 API

**요청**

```
PUT /users/{userId}/profile
Content-Type: application/json
```

**요청 본문 (JSON)**

```json
{
  "nickname": "새로운닉네임",
  "bio": "새로운자기소개",
  "badge": "디자이너",
  "social_links": {
    "instagram": "https://instagram.com/new_user",
    "x": "https://x.com/new_user",
    "openkakao": "https://open.kakao.com/o/xyz"
  }
}
```

**응답**

```json
{
  "success": true,
  "data": {
    "id": "user123",
    "nickname": "새로운닉네임",
    "bio": "새로운자기소개",
    "badge": "디자이너",
    "avatar": "https://example.com/avatar.jpg",
    "social_links": {
      "instagram": "https://instagram.com/new_user",
      "x": "https://x.com/new_user",
      "openkakao": "https://open.kakao.com/o/xyz"
    }
  }
}
```

### 1.3 프로필 이미지 업로드 API

**요청**

```
PUT /users/{userId}/profile/avatar
Content-Type: multipart/form-data
```

**요청 파라미터**

| 파라미터명 | 타입 | 필수 | 설명 |
|-----------|------|-----|------|
| avatar    | File | Y   | 프로필 이미지 파일 |

**응답**

```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://example.com/new-avatar.jpg"
  }
}
```

### 1.4 소셜 링크 업데이트 API

**요청**

```
PUT /users/{userId}/profile/social-links
Content-Type: application/json
```

**요청 본문 (JSON)**

```json
{
  "socialLinks": {
    "instagram": "https://instagram.com/user",
    "x": "https://x.com/user",
    "openkakao": "https://open.kakao.com/o/abcdef"
  }
}
```

**응답**

```json
{
  "success": true,
  "data": {
    "socialLinks": {
      "instagram": "https://instagram.com/user",
      "x": "https://x.com/user",
      "openkakao": "https://open.kakao.com/o/abcdef"
    }
  }
}
```

## 2. 닉네임 관련

### 2.1 닉네임 중복 체크 API

**요청**

```
GET /users/check-nickname?nickname={nickname}
```

**요청 파라미터**

| 파라미터명 | 타입   | 필수 | 설명       |
|-----------|-------|-----|-----------|
| nickname  | String | Y  | 확인할 닉네임 |

**응답**

```json
{
  "success": true,
  "data": {
    "isAvailable": true,
    "message": "사용 가능한 닉네임입니다."
  }
}
```

또는

```json
{
  "success": true,
  "data": {
    "isAvailable": false,
    "message": "이미 사용 중인 닉네임입니다."
  }
}
```

## 3. 칭호(배지) 관련

### 3.1 사용자 배지 목록 조회 API

**요청**

```
GET /users/{userId}/badges
```

**응답**

```json
{
  "success": true,
  "data": [
    {
      "id": "badge1",
      "name": "개발자",
      "description": "개발자 칭호",
      "isActive": true
    },
    {
      "id": "badge2",
      "name": "디자이너",
      "description": "디자이너 칭호",
      "isActive": false
    },
    {
      "id": "badge3",
      "name": "기여자",
      "description": "오픈소스 기여자 칭호",
      "isActive": false
    }
  ]
}
```

### 3.2 모든 배지 목록 조회 API

**요청**

```
GET /badges
```

**응답**

```json
{
  "success": true,
  "data": [
    {
      "id": "badge1",
      "name": "개발자",
      "description": "개발자 칭호"
    },
    {
      "id": "badge2",
      "name": "디자이너",
      "description": "디자이너 칭호"
    },
    {
      "id": "badge3",
      "name": "기여자",
      "description": "오픈소스 기여자 칭호"
    },
    {
      "id": "badge4",
      "name": "운영자",
      "description": "운영자 칭호"
    }
  ]
}
```

### 3.3 활성 배지 설정 API

**요청**

```
PUT /users/{userId}/badges/active
Content-Type: application/json
```

**요청 본문 (JSON)**

```json
{
  "badgeId": "badge2"
}
```

또는 배지 해제를 위해:

```json
{
  "badgeId": null
}
```

**응답**

```json
{
  "success": true,
  "data": {
    "badge": {
      "id": "badge2",
      "name": "디자이너",
      "description": "디자이너 칭호",
      "isActive": true
    }
  }
}
```

## 4. 알림 설정 관련

### 4.1 알림 설정 조회 API

**요청**

```
GET /users/{userId}/notifications/settings
```

**응답**

```json
{
  "success": true,
  "data": {
    "email": true,
    "discord": false
  }
}
```

### 4.2 이메일 알림 설정 업데이트 API

**요청**

```
PUT /users/{userId}/notifications/email
Content-Type: application/json
```

**요청 본문 (JSON)**

```json
{
  "enabled": true
}
```

**응답**

```json
{
  "success": true,
  "data": {
    "email": true,
    "discord": false
  }
}
```

### 4.3 디스코드 알림 설정 업데이트 API

**요청**

```
PUT /users/{userId}/notifications/discord
Content-Type: application/json
```

**요청 본문 (JSON)**

```json
{
  "enabled": true
}
```

**응답**

```json
{
  "success": true,
  "data": {
    "email": true,
    "discord": true
  }
}
```

### 4.4 모든 알림 설정 업데이트 API

**요청**

```
PUT /users/{userId}/notifications/settings
Content-Type: application/json
```

**요청 본문 (JSON)**

```json
{
  "email": true,
  "discord": true
}
```

**응답**

```json
{
  "success": true,
  "data": {
    "email": true,
    "discord": true
  }
}
```

## 5. 계정 관련

### 5.1 계정 탈퇴 API

**요청**

```
DELETE /users/{userId}
Content-Type: application/json
```

**요청 본문 (JSON)**

```json
{
  "password": "현재비밀번호"
}
```

**응답**

```json
{
  "success": true,
  "data": {
    "message": "계정이 성공적으로 삭제되었습니다."
  }
}
```

### 5.2 비밀번호 변경 API

**요청**

```
PUT /users/{userId}/password
Content-Type: application/json
```

**요청 본문 (JSON)**

```json
{
  "currentPassword": "현재비밀번호",
  "newPassword": "새로운비밀번호"
}
```

**응답**

```json
{
  "success": true,
  "data": {
    "message": "비밀번호가 성공적으로 변경되었습니다."
  }
}
```

### 5.3 이메일 변경 API

**요청**

```
PUT /users/{userId}/email
Content-Type: application/json
```

**요청 본문 (JSON)**

```json
{
  "newEmail": "new.email@example.com",
  "password": "현재비밀번호"
}
```

**응답**

```json
{
  "success": true,
  "data": {
    "message": "이메일이 성공적으로 변경되었습니다. 새 이메일로 인증 메일이 전송되었습니다."
  }
}
```

## 에러 코드

| 에러 코드              | 설명                    | HTTP 상태 코드 |
|----------------------|------------------------|--------------|
| UNAUTHORIZED         | 인증되지 않음              | 401          |
| FORBIDDEN            | 권한 없음                 | 403          |
| NOT_FOUND            | 리소스를 찾을 수 없음        | 404          |
| DUPLICATE_NICKNAME   | 닉네임 중복               | 409          |
| INVALID_PASSWORD     | 잘못된 비밀번호             | 400          |
| INVALID_INPUT        | 잘못된 입력 데이터           | 400          |
| INVALID_FILE_TYPE    | 지원하지 않는 파일 타입       | 400          |
| FILE_TOO_LARGE       | 파일 크기 초과             | 400          |
| INTERNAL_SERVER_ERROR | 서버 내부 오류             | 500          |

## 구현 참고 사항

1. 모든 API 호출은 인증이 필요하며, Authorization 헤더에 Bearer 토큰을 포함해야 합니다.
2. 이미지 업로드 시 최대 파일 크기는 5MB로 제한됩니다.
3. 지원 파일 형식: JPG, JPEG, PNG, GIF, WebP
4. 닉네임은 2~20자 이내, 특수문자는 _, - 만 허용됩니다.
5. 자기소개는 최대 500자까지 입력 가능합니다.
6. URL은 유효한 형식이어야 합니다.
