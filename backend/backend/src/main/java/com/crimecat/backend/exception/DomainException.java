package com.crimecat.backend.exception;

public class DomainException extends CrimeCatException{
    public DomainException(ErrorStatus errorStatus) {
        super(errorStatus);
    }
}
