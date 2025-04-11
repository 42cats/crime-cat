package com.crimecat.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ServiceException extends RuntimeException {
    private final ErrorStatus status;
    private final Object dto;

    public <T> ServiceException(ErrorStatus status, T dto) {
        super(status.getMessage());
        this.status = status;
        this.dto = dto;
    }
}
