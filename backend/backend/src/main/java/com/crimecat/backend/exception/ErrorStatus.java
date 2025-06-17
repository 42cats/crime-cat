package com.crimecat.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@AllArgsConstructor
@Getter
public enum ErrorStatus {


    // 🔐 인증/인가 관련
    NOT_GUILD_OWNER("길드의 오너가 아닙니다.", HttpStatus.FORBIDDEN),
    UNAUTHORIZED("인증이 필요합니다.", HttpStatus.UNAUTHORIZED),                     // 401
    FORBIDDEN("접근 권한이 없습니다.", HttpStatus.FORBIDDEN),                          // 403
    INVALID_ACCESS("유효하지 않은 접근입니다.", HttpStatus.FORBIDDEN),               // 403
    LOGIN_REQUIRED("로그인이 필요합니다.", HttpStatus.UNAUTHORIZED),                 // 401

    // 🔎 조회 실패
    NOT_FOUND_COMMENT("댓글을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    BUTTON_ID_NOT_EXISTS("버튼을 찾을 수 없습니다.", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),              // 404
    GUILD_NOT_FOUND("길드를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),              // 404
    GROUP_NOT_FOUND("그룹을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),              // 404
    GROUP_NAME_NOT_FOUND("그룹을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),              // 404
    RESOURCE_NOT_FOUND("요청한 리소스를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),   // 404
    TEAM_NOT_FOUND("제작팀을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    GAME_THEME_NOT_FOUND("게임 테마를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    GAME_HISTORY_NOT_FOUND("게임 기록을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // ❌ 중복/충돌
    USER_ALREADY_EXISTS("이미 존재하는 사용자입니다.", HttpStatus.CONFLICT),         // 409
    TEAM_NAME_ALREADY_EXISTS("이미 존재하는 팀이름 입니다.", HttpStatus.CONFLICT),         // 409
    GUILD_ALREADY_EXISTS("이미 존재하는 길드입니다.", HttpStatus.CONFLICT),          // 409
    GROUP_ALREADY_EXISTS("이미 존재하는 그룹 이름입니다.", HttpStatus.CONFLICT),      // 409
    EMAIL_ALREADY_REGISTERED("이미 등록된 이메일입니다.", HttpStatus.CONFLICT),      // 409
    TEAM_MEMBER_ALREADY_REGISTERED("이미 등록된 멤버입니다.", HttpStatus.CONFLICT),
    NICK_NAME_ALREADY_EXISTS("이미 사용중인 닉네임 입니다.", HttpStatus.CONFLICT),
    HISTORY_ALREADY_EXISTS("이미 기록이 있습니다.", HttpStatus.CONFLICT),

    // 🛑 잘못된 요청
    INVALID_INPUT("잘못된 요청입니다.", HttpStatus.BAD_REQUEST),    //400                 // 400
    INVALID_PARAMETER("요청 파라미터가 잘못되었습니다.", HttpStatus.BAD_REQUEST),     // 400
    MISSING_REQUIRED_FIELD("필수 항목이 누락되었습니다.", HttpStatus.BAD_REQUEST),   // 400
    TOO_MANY_REQUESTS("요청 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.", HttpStatus.TOO_MANY_REQUESTS), // 429
    
    // 📍 위치 매핑 관련
    LOCATION_MAPPING_NOT_FOUND("위치 매핑을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    DUPLICATE_LOCATION_KEYWORD("이미 존재하는 지역 키워드입니다.", HttpStatus.CONFLICT),

    // ⚠️ 처리 불가
    UNSUPPORTED_OPERATION("지원하지 않는 작업입니다.", HttpStatus.METHOD_NOT_ALLOWED), // 405
    UNPROCESSABLE_ENTITY("요청을 처리할 수 없습니다.", HttpStatus.UNPROCESSABLE_ENTITY), // 422

    // 💬 버튼/매크로 관련
    BUTTON_ID_NOT_FOUND("버튼 ID가 존재하지 않습니다.", HttpStatus.BAD_REQUEST),
    MACRO_EXECUTION_FAILED("매크로 실행에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    
    // 🤖 Discord API 관련
    DISCORD_API_ERROR("Discord API 호출에 실패했습니다.", HttpStatus.BAD_GATEWAY),
    DISCORD_GUILD_ROLES_FETCH_FAILED("Discord 길드 역할 목록 조회에 실패했습니다.", HttpStatus.BAD_GATEWAY),
    DISCORD_SERVICE_UNAVAILABLE("Discord 서비스를 일시적으로 사용할 수 없습니다.", HttpStatus.SERVICE_UNAVAILABLE),

    // 🧱 서버 내부 오류
    INTERNAL_ERROR("서버 내부 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR), // 500

    // 분류 시스템
    PERMISSION_NOT_FOUND("권한을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    PERMISSION_NOT_OWNED("보유하지 않은 권한입니다.", HttpStatus.BAD_REQUEST),
    PERMISSION_ALREADY_OWNED("이미 보유한 권한입니다.", HttpStatus.CONFLICT),
    DISCORD_USER_NOT_FOUND("연결된 디스코드 사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    // 포인트 관련
    INSUFFICIENT_POINT("포인트가 부족합니다.", HttpStatus.BAD_REQUEST),                    // 400
    
    // 알림 관련
    NOTIFICATION_NOT_FOUND("알림을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    NOTIFICATION_ALREADY_PROCESSED("이미 처리된 알림입니다.", HttpStatus.CONFLICT),
    INVALID_NOTIFICATION_ACTION("잘못된 액션입니다.", HttpStatus.BAD_REQUEST),
    NOTIFICATION_ACCESS_DENIED("알림에 접근할 권한이 없습니다.", HttpStatus.FORBIDDEN),

    USER_POST_NOT_FOUND("게시글을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    USER_POST_IMAGE_COUNT_EXCEEDED("이미지는 최대 5장까지만 등록 가능합니다.", HttpStatus.BAD_REQUEST),
    USER_POST_ACCESS_DENIED("해당 게시글에 접근할 수 없습니다.", HttpStatus.FORBIDDEN),
    USER_POST_INVALID_UPDATE("게시글을 수정할 수 없습니다.", HttpStatus.BAD_REQUEST),
    USER_POST_LIKE_DUPLICATED("이미 좋아요를 누른 게시글입니다.", HttpStatus.CONFLICT),
    USER_POST_LIKE_NOT_FOUND("좋아요한 기록이 존재하지 않습니다.", HttpStatus.NOT_FOUND),
    
    // 댓글 관련
    COMMENT_NOT_FOUND("댓글을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    COMMENT_NOT_AUTHORIZED("댓글에 대한 권한이 없습니다.", HttpStatus.FORBIDDEN),
    COMMENT_ALREADY_DELETED("이미 삭제된 댓글입니다.", HttpStatus.BAD_REQUEST),
    COMMENT_INVALID_PARENT("잘못된 부모 댓글입니다.", HttpStatus.BAD_REQUEST),
    COMMENT_INVALID_NESTING("대댓글에는 댓글을 달 수 없습니다.", HttpStatus.BAD_REQUEST),
    
    // 팔로우 관련
    FOLLOW_SELF_NOT_ALLOWED("자기 자신을 팔로우할 수 없습니다.", HttpStatus.BAD_REQUEST),
    FOLLOW_ALREADY_EXISTS("이미 팔로우하고 있습니다.", HttpStatus.CONFLICT),
    FOLLOW_NOT_FOUND("팔로우 관계를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    INVALID_REQUEST("본인의 등급은 변경할 수 없습니다.", HttpStatus.BAD_REQUEST ),
    
    // 광고 관련
    ADVERTISEMENT_NOT_FOUND("광고를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    ADVERTISEMENT_PERIOD_OVERLAP("해당 테마는 이미 겹치는 기간에 광고가 등록되어 있습니다.", HttpStatus.CONFLICT),
    ADVERTISEMENT_INVALID_PERIOD("시작 날짜는 종료 날짜보다 이전이어야 합니다.", HttpStatus.BAD_REQUEST),
    
    // 🎙️ Voice Chat 서버 관련
    SERVER_NOT_FOUND("서버를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    SERVER_ACCESS_DENIED("서버에 접근할 권한이 없습니다.", HttpStatus.FORBIDDEN),
    SERVER_PASSWORD_INCORRECT("서버 비밀번호가 잘못되었습니다.", HttpStatus.UNAUTHORIZED),
    SERVER_MEMBER_LIMIT_EXCEEDED("서버 최대 멤버 수를 초과했습니다.", HttpStatus.BAD_REQUEST),
    SERVER_ALREADY_MEMBER("이미 서버의 멤버입니다.", HttpStatus.CONFLICT),
    SERVER_NOT_MEMBER("서버의 멤버가 아닙니다.", HttpStatus.FORBIDDEN),
    
    // 🎙️ Voice Chat 채널 관련
    CHANNEL_NOT_FOUND("채널을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    CHANNEL_ACCESS_DENIED("채널에 접근할 권한이 없습니다.", HttpStatus.FORBIDDEN),
    CHANNEL_ALREADY_MEMBER("이미 채널의 멤버입니다.", HttpStatus.CONFLICT),
    CHANNEL_NOT_MEMBER("채널의 멤버가 아닙니다.", HttpStatus.FORBIDDEN),
    CHANNEL_NAME_DUPLICATE("이미 존재하는 채널 이름입니다.", HttpStatus.CONFLICT),
    INVALID_CHANNEL_TYPE("잘못된 채널 타입입니다.", HttpStatus.BAD_REQUEST),
    
    // 🎙️ Voice Chat 역할 관련
    ROLE_NOT_FOUND("역할을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    ROLE_NAME_DUPLICATE("이미 존재하는 역할 이름입니다.", HttpStatus.CONFLICT),
    CANNOT_MODIFY_DEFAULT_ROLE("기본 역할은 수정할 수 없습니다.", HttpStatus.BAD_REQUEST),
    CANNOT_DELETE_DEFAULT_ROLE("기본 역할은 삭제할 수 없습니다.", HttpStatus.BAD_REQUEST),
    INVALID_ROLE("잘못된 역할입니다.", HttpStatus.BAD_REQUEST),
    ROLE_IN_USE("사용 중인 역할은 삭제할 수 없습니다.", HttpStatus.CONFLICT),
    
    // 🎙️ Voice Chat 멤버 관련
    MEMBER_NOT_FOUND("멤버를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    INSUFFICIENT_PERMISSION("권한이 부족합니다.", HttpStatus.FORBIDDEN),
    INVALID_PERMISSION("잘못된 권한입니다.", HttpStatus.BAD_REQUEST),
    CANNOT_MODIFY_SELF_ROLE("자신의 역할은 수정할 수 없습니다.", HttpStatus.BAD_REQUEST),
    CANNOT_KICK_SELF("자기 자신을 추방할 수 없습니다.", HttpStatus.BAD_REQUEST),
    CANNOT_KICK_SERVER_OWNER("서버 소유자는 추방할 수 없습니다.", HttpStatus.BAD_REQUEST),
    
    // 🎙️ Voice Chat 메시지 관련
    MESSAGE_NOT_FOUND("메시지를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    MESSAGE_ACCESS_DENIED("메시지에 접근할 권한이 없습니다.", HttpStatus.FORBIDDEN),
    MESSAGE_CONTENT_EMPTY("메시지 내용이 비어있습니다.", HttpStatus.BAD_REQUEST),
    MESSAGE_CONTENT_TOO_LONG("메시지가 너무 깁니다.", HttpStatus.BAD_REQUEST);

    private final String message;
    private final HttpStatus status;

    public CrimeCatException asException() {
        return new CrimeCatException(this);
    }
    public ControllerException asControllerException() {
        return new ControllerException(this);
    }
    public ServiceException asServiceException() {
        return new ServiceException(this);
    }
    public DomainException asDomainException() {
        return new DomainException(this);
    }
}
