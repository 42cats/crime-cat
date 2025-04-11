package com.crimecat.backend.exception;

import com.crimecat.backend.guild.dto.MessageDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class ExceptionController extends ResponseEntityExceptionHandler {
    @ExceptionHandler(value = {ServiceException.class})
    protected ResponseEntity<MessageDto<?>> handleServiceException(ServiceException serviceException) {
        MessageDto<?> msgDto = new MessageDto<>(serviceException.getMessage(), serviceException.getDto());
        return new ResponseEntity<>(msgDto, serviceException.getStatus().getStatus());
    }
}
