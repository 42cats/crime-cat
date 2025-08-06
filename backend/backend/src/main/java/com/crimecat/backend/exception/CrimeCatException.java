package com.crimecat.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CrimeCatException extends RuntimeException {
    private final HttpStatus status;
    private final ErrorStatus errorStatus;

    public CrimeCatException(ErrorStatus errorStatus) {
        super(errorStatus.getMessage());
        this.status = errorStatus.getStatus();
        this.errorStatus = errorStatus;
    }
}
