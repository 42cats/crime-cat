package com.crimecat.backend.userPost.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "user_post_images")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserPostImage {

    @Id
    @UuidGenerator
    @GeneratedValue
    @Getter
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "ID", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_post_images_post"))
    private UserPost post;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public void setPost(UserPost post) {
        this.post = post;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    static public UserPostImage from (UserPost post, String imageUrl, int sortOrder) {
        return UserPostImage.builder()
                .post(post)
                .imageUrl(imageUrl)
                .sortOrder(sortOrder)
                .build();
    }
}
