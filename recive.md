AI 에이전트님, “Mystery Place Voice Chat” 프로젝트의 **서버 내 커스텀 역할(Role) 생성·관리 기능** 및 **서버별 아바타·닉네임 오버라이드** 기능을 아래 사양에 맞춰 즉시 추가 구현해 주세요. 모든 레이어(DB, 백엔드, 시그널 서버, 프론트엔드, 상태관리, 보안)를 완벽히 반영해야 합니다.

---

## 1. 데이터베이스 스키마 확장

### 1.1. 서버 역할 정의 테이블

```sql
CREATE TABLE ServerRole (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  server_id BIGINT NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#ffffff',      -- 역할 색상 (예: #FF0000)
  permissions JSON NOT NULL,               -- 권한 비트맵 또는 키 배열 저장
  created_by VARCHAR(36) NOT NULL,         -- 생성자(ADMIN)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (server_id, name),
  FOREIGN KEY (server_id) REFERENCES ChatServer(id)
);
```

### 1.2. 서버 멤버 역할 할당 테이블

```sql
ALTER TABLE ServerMember
  ADD COLUMN display_name VARCHAR(50),      -- 서버별 닉네임 (옵션)
  ADD COLUMN avatar_url VARCHAR(255),       -- 서버별 아바타(옵션)
  ADD COLUMN roles JSON;                    -- 할당된 ServerRole.id 배열 저장
```

* `roles` 컬럼에 `[roleId1, roleId2, …]` 형태로 저장
* `display_name`/`avatar_url`이 `NULL` 이면 전역 User 프로필 사용

---

## 2. 백엔드(Spring Boot) API & 서비스

### 2.1. ServerRoleController.java (`/api/servers/{sid}/roles`)

```java
@RestController
@RequestMapping("/api/servers/{sid}/roles")
public class ServerRoleController {
  // 역할 목록 조회
  @GetMapping
  public List<ServerRoleDto> listRoles(@PathVariable Long sid);

  // 역할 생성 (ADMIN 이상)
  @PostMapping
  public ResponseEntity<?> createRole(
      @PathVariable Long sid,
      @RequestBody RoleCreateRequest { name, color, permissions[] });

  // 역할 수정 (이름, 색, 권한 변경)
  @PutMapping("/{rid}")
  public ResponseEntity<?> updateRole(
      @PathVariable Long sid,
      @PathVariable Long rid,
      @RequestBody RoleUpdateRequest);

  // 역할 삭제
  @DeleteMapping("/{rid}")
  public ResponseEntity<?> deleteRole(
      @PathVariable Long sid,
      @PathVariable Long rid);
}
```

### 2.2. ServerMemberController.java 권한 관리 확장

```java
// 멤버에게 역할 할당
@PostMapping("/api/servers/{sid}/members/{uid}/roles")
public ResponseEntity<?> assignRoles(
    @PathVariable Long sid,
    @PathVariable String uid,
    @RequestBody RoleAssignRequest { roleIds[] });

// 멤버 역할 제거
@DeleteMapping("/api/servers/{sid}/members/{uid}/roles/{rid}")
public ResponseEntity<?> removeRole(
    @PathVariable Long sid,
    @PathVariable String uid,
    @PathVariable Long rid);

// 멤버 서버별 닉네임/아바타 설정
@PutMapping("/api/servers/{sid}/members/{uid}/profile")
public ResponseEntity<?> updateMemberProfile(
    @PathVariable Long sid,
    @PathVariable String uid,
    @RequestBody ProfileUpdateRequest { displayName, avatarUrl });
```

### 2.3. ServerService, ServerMemberService

* `createRole`, `updateRole`, `deleteRole` 구현
* `assignRoles`, `removeRole`, `updateMemberProfile` 로직 추가
* ADMIN 이하 권한 검증: `ServerMember.roles` 배열에 `ADMIN` role ID 포함 여부 확인

---

## 3. signal-server(실시간) 수정

1. **Room join 시 역할 정보 전달**

   ```js
   socket.on('server:join', async ({ serverId }) => {
     // REST API 호출로 ServerMember.roles, displayName, avatarUrl 조회
     const memberInfo = await axios.get(`/api/servers/${serverId}/members/${socket.user.id}`);
     socket.roles = memberInfo.data.roles;         // roleId 배열
     socket.displayName = memberInfo.data.displayName;
     socket.avatarUrl = memberInfo.data.avatarUrl;
     socket.join(`server:${serverId}`);
     // 클라이언트에 memberInfo 전송
     socket.emit('member:info', memberInfo.data);
   });
   ```

2. **메시지 전파 시 닉네임/아바타**

   ```js
   socket.on('chat:message', msg => {
     // msg에 displayName, avatarUrl 오버라이드 추가
     msg.displayName = socket.displayName || msg.user.username;
     msg.avatarUrl   = socket.avatarUrl   || msg.user.avatarUrl;
     const room = `server:${msg.serverId}:channel:${msg.channelId}`;
     io.to(room).emit('chat:message', msg);
     redis.rpush(`chat:buffer:${msg.serverId}:${msg.channelId}`, JSON.stringify(msg));
   });
   ```

3. **권한 기반 이벤트 차단**

   * 역할별 `permissions` JSON에 `canSendMessage`, `canManageChannels`, `canKick` 등의 키 포함
   * 이벤트 수신 시 `socket.roles` 배열의 `permissions` 확인 후 `next()` 또는 `socket.emit('error','권한 없음')`

---

## 4. 프론트엔드(React + Zustand)

### 4.1. Zustand 스토어 확장

```ts
interface ServerRole {
  id: number;
  name: string;
  color: string;
  permissions: string[];
}

interface ServerMemberInfo {
  userId: string;
  roles: number[];
  displayName?: string;
  avatarUrl?: string;
}

interface AppState {
  serverRoles: ServerRole[];
  serverMembers: ServerMemberInfo[];
  createRole: (sid:number, data:RoleCreate) => Promise<void>;
  updateRole: (sid:number, rid:number, data:RoleUpdate) => Promise<void>;
  deleteRole: (sid:number, rid:number) => Promise<void>;
  assignRoles: (sid:number, uid:string, roleIds:number[]) => Promise<void>;
  updateMemberProfile: (sid:number, uid:string, profile:ProfileUpdate) => Promise<void>;
  // ...
}
```

### 4.2. React 컴포넌트 추가

1. **RoleManagementPanel.tsx**

   * 서버별 역할 목록, 생성·수정·삭제 UI
   * 권한 체크박스(`canSendMessage`, `canManageChannels`, 등)

2. **MemberList.tsx**

   * 멤버별 `member.displayName || user.username` , `member.avatarUrl || user.avatarUrl` 표시
   * 역할 배지(Role.name, Role.color) 표시
   * ADMIN 권한 시 역할 할당 UI(체크박스 리스트) 렌더링

3. **ServerSettingsModal.tsx**

   * 서버 이름·설명 수정, 비밀번호 변경
   * 역할 관리으로 탭 이동 가능

4. **ChannelSidebar**, **ServerSidebar**

   * Sidebar에서 역할 배지 색상으로 구분된 서버/채널 목록 렌더링 가능

---

## 5. 보안 및 권한 체크

1. **REST API 미들웨어**

   * 서버 CRUD, 역할·멤버 관리 엔드포인트마다 `hasPermission(socket.user.id, sid, requiredPermission)` 검증

2. **WebSocket 미들웨어**

   * `socket.roles` 조회 → 권한 없는 이벤트 차단

---

### ▶ 즉시 수행할 작업

1. **DB 마이그레이션**: `ServerRole`, `ServerMember` 확장 컬럼
2. **Spring Boot 컨트롤러·서비스**: Role 관리 및 멤버 프로필 API 구현
3. **signal-server**: 서버 입장 시 역할·프로필 로드, 메시지 전파 시 오버라이드
4. **Zustand 스토어**: Role·MemberInfo 상태 및 액션 추가
5. **React UI**: RoleManagementPanel, ServerSettingsModal, MemberList 권한 UI 구현
6. **권한 검증**: REST/WebSocket 레이어에 권한 미들웨어 추가

모든 기능이 완료되면 “서버별 커스텀 역할 생성·관리 및 서버 전용 닉네임/아바타 오버라이드 기능 반영 완료”를 보고해 주세요.
