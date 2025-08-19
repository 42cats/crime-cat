package com.crimecat.backend.schedule.domain;

/**
 * 이벤트 타입을 정의하는 Enum
 * FIXED: 날짜가 확정된 일정
 * FLEXIBLE: 날짜 협의가 필요한 일정
 */
public enum EventType {
    FIXED,      // 확정 일정 (날짜가 정해진 일정)
    FLEXIBLE    // 협의 일정 (날짜 협의 후 확정하는 일정)
}