package com.crimecat.backend.schedule.controller;

import com.crimecat.backend.schedule.domain.EventStatus;
import com.crimecat.backend.schedule.dto.PublicEventResponse;
import com.crimecat.backend.schedule.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/schedule")
@RequiredArgsConstructor
public class SchedulePublicController {

    private final ScheduleService scheduleService;

    /**
     * 퍼블릭 일정 목록 조회
     * - 비로그인 사용자도 접근 가능
     * - 카테고리 및 상태별 필터링 지원
     */
    @GetMapping("/events")
    public ResponseEntity<List<PublicEventResponse>> getEvents(@RequestParam(required = false) String category,
                                                               @RequestParam(required = false) EventStatus status) {
        return ResponseEntity.ok(scheduleService.getPublicEvents(category, status));
    }

    /**
     * 퍼블릭 일정 상세 조회
     * - 비로그인 사용자도 접근 가능
     * - 공개 일정의 기본 정보 제공
     */
    @GetMapping("/events/{eventId}")
    public ResponseEntity<PublicEventResponse> getEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(scheduleService.getPublicEvent(eventId));
    }

    /**
     * 퍼블릭 일정 가용시간 조회
     * - 비로그인 사용자도 접근 가능
     * - 참여 여부와 관계없이 시간 정보 확인 가능
     */
    @GetMapping("/events/{eventId}/availability")
    public ResponseEntity<List<LocalDateTime[]>> getAvailability(@PathVariable UUID eventId) {
        return ResponseEntity.ok(scheduleService.getPublicAvailability(eventId));
    }

    /**
     * 퍼블릭 일정 참여자 수 조회
     * - 비로그인 사용자도 접근 가능
     * - 개인 식별 정보 제외한 참여자 수만 제공
     */
    @GetMapping("/events/{eventId}/participant-count")
    public ResponseEntity<Integer> getParticipantCount(@PathVariable UUID eventId) {
        return ResponseEntity.ok(scheduleService.getPublicParticipantCount(eventId));
    }

    /**
     * 카테고리별 일정 목록 조회
     * - 특정 카테고리의 모집 중인 일정만 조회
     */
    @GetMapping("/events/category/{category}")
    public ResponseEntity<List<PublicEventResponse>> getEventsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(scheduleService.getPublicEvents(category, EventStatus.RECRUITING));
    }

    /**
     * 모집 중인 일정 목록 조회
     * - 현재 참여 가능한 일정들만 조회
     */
    @GetMapping("/events/recruiting")
    public ResponseEntity<List<PublicEventResponse>> getRecruitingEvents() {
        return ResponseEntity.ok(scheduleService.getPublicEvents(null, EventStatus.RECRUITING));
    }
}