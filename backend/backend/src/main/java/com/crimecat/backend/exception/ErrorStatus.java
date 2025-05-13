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

    // ❌ 중복/충돌
    USER_ALREADY_EXISTS("이미 존재하는 사용자입니다.", HttpStatus.CONFLICT),         // 409
    GUILD_ALREADY_EXISTS("이미 존재하는 길드입니다.", HttpStatus.CONFLICT),          // 409
    GROUP_ALREADY_EXISTS("이미 존재하는 그룹 이름입니다.", HttpStatus.CONFLICT),      // 409
    EMAIL_ALREADY_REGISTERED("이미 등록된 이메일입니다.", HttpStatus.CONFLICT),      // 409
    TEAM_MEMBER_ALREADY_REGISTERED("이미 등록된 멤버입니다.", HttpStatus.CONFLICT),
    NICK_NAME_ALREADY_EXISTS("이미 사용중인 닉네임 입니다.", HttpStatus.CONFLICT),

    // 🛑 잘못된 요청
    INVALID_INPUT("잘못된 요청입니다.", HttpStatus.BAD_REQUEST),    //400                 // 400
    INVALID_PARAMETER("요청 파라미터가 잘못되었습니다.", HttpStatus.BAD_REQUEST),     // 400
    MISSING_REQUIRED_FIELD("필수 항목이 누락되었습니다.", HttpStatus.BAD_REQUEST),   // 400

    // ⚠️ 처리 불가
    UNSUPPORTED_OPERATION("지원하지 않는 작업입니다.", HttpStatus.METHOD_NOT_ALLOWED), // 405
    UNPROCESSABLE_ENTITY("요청을 처리할 수 없습니다.", HttpStatus.UNPROCESSABLE_ENTITY), // 422

    // 💬 버튼/매크로 관련
    BUTTON_ID_NOT_FOUND("버튼 ID가 존재하지 않습니다.", HttpStatus.BAD_REQUEST),
    MACRO_EXECUTION_FAILED("매크로 실행에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),

    // 🧱 서버 내부 오류
    INTERNAL_ERROR("서버 내부 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR), // 500

    // 분류 시스템
    PERMISSION_NOT_FOUND("권한을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    PERMISSION_NOT_OWNED("보유하지 않은 권한입니다.", HttpStatus.BAD_REQUEST),
    PERMISSION_ALREADY_OWNED("이미 보유한 권한입니다.", HttpStatus.CONFLICT),
    DISCORD_USER_NOT_FOUND("연결된 디스코드 사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
련
    // 포인트 관련
    INSUFFICIENT_POINT("포인트가 부족합니다.", HttpStatus.BAD_REQUEST);                    // 400

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
