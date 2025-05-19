package com.crimecat.backend.utils;

import com.crimecat.backend.exception.ErrorStatus;
import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.Field;

@Slf4j
public class ObjectUtil {
    public static<T> T getField(Object o, String fieldName, Class<T> targetClass) {
        Object target = null;
        try {
            target = getField(o, o.getClass(), fieldName);
        } catch (NoSuchFieldException ignored) {
        } catch (IllegalAccessException e) {
            log.debug("[ERROR] {}:: {}", e.getClass(), e.getMessage());
            throw new RuntimeException(e);
        }
        try {
            target = getField(o, o.getClass().getSuperclass(), fieldName);
        } catch (NoSuchFieldException e) {
            log.debug("[ERROR] {}:: {}", e.getClass(), e.getMessage());
        } catch (IllegalAccessException e) {
            log.debug("[ERROR] {}:: {}", e.getClass(), e.getMessage());
            throw new RuntimeException(e);
        }
        if (targetClass.isInstance(target)) {
            return targetClass.cast(target);
        }
        log.debug("[ERROR] target {} is not a type of {}", target, targetClass);
        return null;
    }

    private static Object getField(Object o, Class<?> objClass, String fieldName)
            throws NoSuchFieldException, IllegalAccessException {
        if (objClass == null) {
            throw new IllegalAccessException();
        }
        Field dataField = objClass.getDeclaredField(fieldName);
        dataField.setAccessible(true);
        return dataField.get(o);
    }
}
