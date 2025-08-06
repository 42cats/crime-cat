package com.crimecat.backend.boardPost.repository;

import com.crimecat.backend.boardPost.entity.TempAttachment;
import com.crimecat.backend.webUser.domain.WebUser;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * 임시 첨부파일 리포지토리
 */
@Repository
public interface TempAttachmentRepository extends JpaRepository<TempAttachment, UUID> {

    /**
     * tempId로 임시 첨부파일 조회
     */
    Optional<TempAttachment> findByTempId(String tempId);

    /**
     * 사용자별 임시 첨부파일 조회
     */
    List<TempAttachment> findByUser(WebUser user);

    /**
     * 만료된 임시 첨부파일 조회
     */
    @Query("SELECT t FROM TempAttachment t WHERE t.expiresAt < :now")
    List<TempAttachment> findExpiredAttachments(@Param("now") LocalDateTime now);

    /**
     * 만료된 임시 첨부파일 삭제 (배치 작업용)
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM TempAttachment t WHERE t.expiresAt < :now")
    int deleteExpiredAttachments(@Param("now") LocalDateTime now);

    /**
     * 특정 사용자의 임시 첨부파일 개수
     */
    long countByUser(WebUser user);

    /**
     * 특정 기간 내 만료되는 임시 첨부파일 조회
     */
    @Query("SELECT t FROM TempAttachment t WHERE t.expiresAt BETWEEN :start AND :end ORDER BY t.expiresAt")
    List<TempAttachment> findAttachmentsExpiringBetween(
        @Param("start") LocalDateTime start, 
        @Param("end") LocalDateTime end
    );

    /**
     * 저장된 파일명으로 임시 첨부파일 조회
     */
    Optional<TempAttachment> findByStoredFilename(String storedFilename);
}