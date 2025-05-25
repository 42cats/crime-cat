package com.crimecat.backend.gametheme.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MinMaxListValidator.class)
public @interface MinMaxChecks {
    MinMaxCheck[] value();
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    String message() default "최소값이 최대값보다 큽니다.";
}
