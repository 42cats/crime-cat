package com.crimecat.backend.chat.repository;

import com.crimecat.backend.chat.domain.AudioFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AudioFileRepository extends JpaRepository<AudioFile, UUID> {

    /**
     * 활성 상태의 오디오 파일만 조회
     */
    List<AudioFile> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * 모든 오디오 파일을 최신순으로 조회 (관리자용)
     */
    Page<AudioFile> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * 특정 사용자가 업로드한 오디오 파일 조회
     */
    Page<AudioFile> findByUploadedByOrderByCreatedAtDesc(UUID uploadedBy, Pageable pageable);

    /**
     * 활성 상태이면서 특정 ID인 오디오 파일 조회
     */
    Optional<AudioFile> findByIdAndIsActiveTrue(UUID id);

    /**
     * 파일명으로 오디오 파일 조회
     */
    Optional<AudioFile> findByFilenameAndIsActiveTrue(String filename);

    /**
     * MIME 타입별 오디오 파일 조회
     */
    List<AudioFile> findByMimeTypeAndIsActiveTrueOrderByCreatedAtDesc(String mimeType);

    /**
     * 총 파일 크기 계산
     */
    @Query("SELECT COALESCE(SUM(af.fileSize), 0) FROM AudioFile af WHERE af.isActive = true")
    Long getTotalActiveFileSize();

    /**
     * 특정 사용자의 총 파일 크기 계산
     */
    @Query("SELECT COALESCE(SUM(af.fileSize), 0) FROM AudioFile af WHERE af.uploadedBy = :userId AND af.isActive = true")
    Long getTotalFileSizeByUser(@Param("userId") UUID userId);
}