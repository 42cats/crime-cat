package com.crimecat.backend.schedule.controller;

import com.crimecat.backend.schedule.domain.EventStatus;
import com.crimecat.backend.schedule.dto.EventCreateRequest;
import com.crimecat.backend.schedule.dto.EventResponse;
import com.crimecat.backend.schedule.dto.UserCalendarRequest;
import com.crimecat.backend.schedule.service.ScheduleService;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestBody EventCreateRequest request,
                                           @AuthenticationPrincipal WebUser currentUser) {
        scheduleService.createEvent(request, currentUser);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/events/{eventId}/join")
    public ResponseEntity<?> joinEvent(@PathVariable UUID eventId,
                                       @AuthenticationPrincipal WebUser currentUser) {
        scheduleService.joinEvent(eventId, currentUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/events")
    public ResponseEntity<List<EventResponse>> getEvents(@RequestParam(required = false) String category,
                                                         @RequestParam(required = false) EventStatus status) {
        return ResponseEntity.ok(scheduleService.getEvents(category, status));
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(scheduleService.getEvent(eventId));
    }

    @PostMapping("/my-calendar")
    public ResponseEntity<?> saveUserCalendar(@RequestBody UserCalendarRequest request,
                                              @AuthenticationPrincipal WebUser currentUser) {
        scheduleService.saveUserCalendar(request, currentUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/events/{eventId}/availability")
    public ResponseEntity<List<LocalDateTime[]>> getAvailability(@PathVariable UUID eventId) {
        return ResponseEntity.ok(scheduleService.calculateAvailability(eventId));
    }
}
