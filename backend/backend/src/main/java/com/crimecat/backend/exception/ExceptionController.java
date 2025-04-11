package com.crimecat.backend.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class ExceptionController extends ResponseEntityExceptionHandler {
    @ExceptionHandler(value = {CrimeCatException.class})
    protected ResponseEntity<ErrorResponse> handleException(CrimeCatException exception) {
        return ResponseEntity
                .status(exception.getStatus())
                .body(new ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(value = {ControllerException.class})
    protected ResponseEntity<ErrorResponse> handleControllerException(ControllerException exception) {
        return ResponseEntity
                .status(exception.getStatus())
                .body(new ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(value = {ServiceException.class})
    protected ResponseEntity<ErrorResponse> handleServiceException(ServiceException exception) {
        return ResponseEntity
                .status(exception.getStatus())
                .body(new ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(value = {DomainException.class})
    protected ResponseEntity<ErrorResponse> handleDomainException(DomainException exception) {
        return ResponseEntity
                .status(exception.getStatus())
                .body(new ErrorResponse(exception.getMessage()));
    }
}
