package com.crimecat.backend.boardPost.repository;

import com.crimecat.backend.boardPost.entity.BoardPostAttachment;
import com.crimecat.backend.boardPost.domain.BoardPost;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 게시글 첨부파일 리포지토리
 */
@Repository
public interface BoardPostAttachmentRepository extends JpaRepository<BoardPostAttachment, UUID> {

    /**
     * 게시글별 첨부파일 조회 (정렬 순서대로)
     */
    List<BoardPostAttachment> findByBoardPostOrderBySortOrder(BoardPost boardPost);

    /**
     * 게시글별 오디오 첨부파일만 조회
     */
    @Query("SELECT a FROM BoardPostAttachment a WHERE a.boardPost = :boardPost AND a.attachmentType = 'AUDIO' ORDER BY a.sortOrder")
    List<BoardPostAttachment> findAudioAttachmentsByBoardPost(@Param("boardPost") BoardPost boardPost);

    /**
     * 접근 정책별 첨부파일 조회
     */
    @Query("SELECT a FROM BoardPostAttachment a WHERE a.boardPost = :boardPost AND a.accessPolicy = :accessPolicy ORDER BY a.sortOrder")
    List<BoardPostAttachment> findByBoardPostAndAccessPolicy(
        @Param("boardPost") BoardPost boardPost, 
        @Param("accessPolicy") BoardPostAttachment.AccessPolicy accessPolicy
    );

    /**
     * 파일명으로 첨부파일 조회
     */
    BoardPostAttachment findByStoredFilename(String storedFilename);

    /**
     * 특정 게시글의 첨부파일 개수
     */
    long countByBoardPost(BoardPost boardPost);

    /**
     * 특정 게시글의 오디오 첨부파일 개수
     */
    @Query("SELECT COUNT(a) FROM BoardPostAttachment a WHERE a.boardPost = :boardPost AND a.attachmentType = 'AUDIO'")
    long countAudioAttachmentsByBoardPost(@Param("boardPost") BoardPost boardPost);

    /**
     * 게시글 ID와 첨부파일 타입으로 조회
     */
    @Query("SELECT a FROM BoardPostAttachment a WHERE a.boardPost.id = :postId AND a.attachmentType = :attachmentType ORDER BY a.sortOrder")
    List<BoardPostAttachment> findByBoardPost_IdAndAttachmentType(
        @Param("postId") UUID postId, 
        @Param("attachmentType") BoardPostAttachment.AttachmentType attachmentType
    );
}