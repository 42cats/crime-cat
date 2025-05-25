package com.crimecat.backend.userPost.repository;

import com.crimecat.backend.userPost.domain.UserPost;
import com.crimecat.backend.userPost.domain.UserPostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.UUID;

@Repository
public interface UserPostImageRepository extends JpaRepository<UserPostImage, UUID> {

    void deleteByPost(UserPost post);

    void deleteUserPostImagesById(UUID id);

    @Modifying
    @Query("DELETE FROM UserPostImage i WHERE i.id IN :ids")
    void deleteAllByIdInBatch(@Param("ids") Collection<UUID> ids);
}
