package com.crimecat.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@AllArgsConstructor
@Getter
public enum ErrorStatus {
    GUILD_ALREADY_EXISTS("Guild already exists", HttpStatus.BAD_REQUEST);

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
