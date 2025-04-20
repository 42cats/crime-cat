package com.crimecat.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@AllArgsConstructor
@Getter
public enum ErrorStatus {
    GUILD_ALREADY_EXISTS("Guild already exists", HttpStatus.BAD_REQUEST),
    GUILD_NOT_EXISTS("Guild not exists", HttpStatus.BAD_REQUEST),
    GROUP_NAME_EXISTS("Group Name Not exists", HttpStatus.BAD_REQUEST),
    GROUP_NAME_NOT_EXISTS("Group Name Not exists", HttpStatus.BAD_REQUEST),
    BUTTON_ID_NOT_EXISTS("Button Id Not exists", HttpStatus.BAD_REQUEST),
    NOT_GUILD_OWNER("Not the owner of the guild", HttpStatus.FORBIDDEN);


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
