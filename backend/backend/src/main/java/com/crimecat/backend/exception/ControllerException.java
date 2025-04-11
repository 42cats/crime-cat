package com.crimecat.backend.exception;

public class ControllerException extends CrimeCatException {
  public ControllerException(ErrorStatus errorStatus) {
      super(errorStatus);
  }
}
