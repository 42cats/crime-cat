package com.crimecat.backend.notification.repository;

import com.crimecat.backend.notification.domain.Notification;
import com.crimecat.backend.notification.enums.NotificationStatus;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    /**
     * 특정 사용자의 읽지 않은 알림 조회 (User 객체 사용)
     */
    List<Notification> findByUserAndStatusOrderByCreatedAtDesc(User user, NotificationStatus status);
    
    /**
     * 특정 사용자의 읽지 않은 알림 조회 (UUID 사용 - 하위 호환성)
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.status = :status ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("status") NotificationStatus status);
    
    /**
     * 특정 사용자의 모든 알림 페이징 조회 (User 객체 사용)
     */
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    /**
     * 특정 사용자의 모든 알림 페이징 조회 (UUID 사용 - 하위 호환성)
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    Page<Notification> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId, Pageable pageable);
    
    /**
     * 특정 사용자의 특정 타입 알림 조회 (User 객체 사용)
     */
    List<Notification> findByUserAndTypeOrderByCreatedAtDesc(User user, NotificationType type);
    
    /**
     * 특정 사용자의 특정 타입 알림 조회 (UUID 사용 - 하위 호환성)
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.type = :type ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("type") NotificationType type);
    
    /**
     * 특정 사용자의 읽지 않은 알림 개수 (User 객체 사용)
     */
    long countByUserAndStatus(User user, NotificationStatus status);
    
    /**
     * 특정 사용자의 읽지 않은 알림 개수 (UUID 사용 - 하위 호환성)
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.status = :status")
    long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") NotificationStatus status);
    
    /**
     * 만료된 알림 조회
     */
    @Query("SELECT n FROM Notification n WHERE n.expiresAt IS NOT NULL AND n.expiresAt < :now")
    List<Notification> findExpiredNotifications(@Param("now") LocalDateTime now);
    
    /**
     * 특정 사용자의 모든 알림을 읽음 처리 (User 객체 사용)
     */
    @Query("UPDATE Notification n SET n.status = :status WHERE n.user = :user AND n.status = :currentStatus")
    int updateStatusByUser(@Param("user") User user, 
                          @Param("status") NotificationStatus status,
                          @Param("currentStatus") NotificationStatus currentStatus);
    
    /**
     * 특정 사용자의 모든 알림을 읽음 처리 (UUID 사용 - 하위 호환성)
     */
    @Query("UPDATE Notification n SET n.status = :status WHERE n.user.id = :userId AND n.status = :currentStatus")
    int updateStatusByUserId(@Param("userId") UUID userId, 
                            @Param("status") NotificationStatus status,
                            @Param("currentStatus") NotificationStatus currentStatus);
    
    /**
     * 특정 기간보다 오래된 알림 삭제
     */
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    int deleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
}
