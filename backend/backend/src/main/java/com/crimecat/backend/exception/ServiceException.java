package com.crimecat.backend.exception;

public class ServiceException extends CrimeCatException {
    public ServiceException(ErrorStatus errorStatus) {
        super(errorStatus);
    }
}
