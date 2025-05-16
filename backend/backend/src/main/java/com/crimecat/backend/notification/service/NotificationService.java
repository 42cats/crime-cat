package com.crimecat.backend.notification.service;

import com.crimecat.backend.notification.domain.Notification;
import com.crimecat.backend.notification.dto.response.NotificationDto;
import com.crimecat.backend.notification.enums.NotificationStatus;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.repository.NotificationRepository;
import com.crimecat.backend.notification.utils.JsonUtil;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.enums.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 알림 서비스 - 생성, 조회, 상태 관리
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final JsonUtil jsonUtil;
    
    /**
     * 알림 생성 및 저장 (다른 서비스에서 호출)
     */
    public UUID createAndSendNotification(
        NotificationType type,
        UUID recipientId,       // 받는 사람
        UUID senderId,          // 보내는 사람 (선택적)
        String title,
        String message,
        Map<String, Object> data // 알림별 특화 데이터
    ) {
        // 1. 발송 대상 결정 (현재는 단일 수신자만)
        List<UUID> recipients = List.of(recipientId);
        
        // 2. 각 수신자별 알림 생성
        List<Notification> notifications = recipients.stream()
            .map(userId -> createNotification(type, userId, senderId, title, message, data))
            .collect(Collectors.toList());
        
        // 3. 데이터베이스 저장
        List<Notification> savedNotifications = notificationRepository.saveAll(notifications);
        
        // 4. 실시간 발송 (추후 확장점)
        // publishNotificationEvents(savedNotifications);
        
        return savedNotifications.getFirst().getId();
    }
    
    /**
     * 사용자별 알림 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(UUID userId, Pageable pageable) {

        Page<Notification> notifications = notificationRepository
            .findByUserIdOrderByCreatedAtDesc(userId, pageable);
        
        return notifications.map(this::convertToDto);
    }
    
    /**
     * 사용자별 특정 타입 알림 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(UUID userId, Pageable pageable, List<NotificationType> types) {
        Page<Notification> notifications;
        
        if (types == null || types.isEmpty()) {
            // 타입 지정이 없으면 모든 알림 조회
            notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        } else {
            // 특정 타입들만 필터링
            notifications = notificationRepository.findByUserIdAndTypeIn(userId, types, pageable);
        }
        
        return notifications.map(this::convertToDto);
    }
    
    /**
     * 사용자별 알림 목록 조회 (상태, 타입, 검색 필터링 포함)
     */
    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(
        UUID userId, 
        Pageable pageable, 
        List<NotificationType> types,
        List<NotificationStatus> statuses,
        String keyword
    ) {
        // 빈 문자열 처리
        if (keyword != null && keyword.trim().isEmpty()) {
            keyword = null;
        }
        
        Page<Notification> notifications = notificationRepository
            .findByUserIdWithFilters(userId, types, statuses, keyword, pageable);
        
        return notifications.map(this::convertToDto);
    }
    
    /**
     * 특정 알림 조회
     */
    @Transactional(readOnly = true)
    public NotificationDto getNotification(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(ErrorStatus.NOTIFICATION_NOT_FOUND::asServiceException);
        
        // 권한 검증: 알림 소유자 또는 관리자만 접근 가능
        AuthenticationUtil.validateSelfOrHasRole(notification.getReceiverId(), UserRole.ADMIN);
        
        return convertToDto(notification);
    }
    
    /**
     * 알림 읽음 처리
     */
    public void markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(ErrorStatus.NOTIFICATION_NOT_FOUND::asServiceException);
        
        // 권한 검증
        if(!AuthenticationUtil.getCurrentUser().getId().equals(notification.getReceiverId())){
            throw ErrorStatus.NOTIFICATION_ACCESS_DENIED.asServiceException();
        }
        
        if (notification.getStatus() == NotificationStatus.UNREAD) {
            notification.setStatus(NotificationStatus.READ);
            notification.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }
    
    /**
     * 미읽은 알림 개수 조회
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
    }
    
    /**
     * 알림 생성 헬퍼 메소드
     */
    private Notification createNotification(
        NotificationType type,
        UUID recipientId,
        UUID senderId,
        String title,
        String message,
        Map<String, Object> data
    ) {
        return Notification.from(type, recipientId, senderId, title, message, data);
    }
    
    /**
     * NotificationDto 변환
     */
    private NotificationDto convertToDto(Notification notification) {
        return NotificationDto.from(notification);
    }
}
