package com.crimecat.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ErrorResponse {
    private String message;
    
    public static ErrorResponse of(ErrorStatus errorStatus) {
        return new ErrorResponse(errorStatus.getMessage());
    }
}
