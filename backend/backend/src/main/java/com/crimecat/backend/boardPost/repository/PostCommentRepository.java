package com.crimecat.backend.boardPost.repository;

import com.crimecat.backend.boardPost.domain.PostComment;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, UUID> {

    Integer countAllByPostIdAndIsDeletedFalse(UUID postId);

    List<PostComment> findAllByPostIdAndParentIdIsNull(UUID postId, Sort sort);

    List<PostComment> findAllByParentId(UUID commentId, Sort sort);

    Optional<PostComment> findByIdAndIsDeletedFalse(UUID commentId);

}
