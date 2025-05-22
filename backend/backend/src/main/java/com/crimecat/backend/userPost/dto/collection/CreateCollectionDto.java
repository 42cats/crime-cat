package com.crimecat.backend.userPost.dto.collection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCollectionDto {
    
    private String name;
    private String description;
    private Boolean isPrivate;
    
    public void validate() {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("컬렉션 이름은 필수입니다.");
        }
        
        if (name.trim().length() > 50) {
            throw new IllegalArgumentException("컬렉션 이름은 50자를 초과할 수 없습니다.");
        }
        
        if (description != null && description.length() > 200) {
            throw new IllegalArgumentException("컬렉션 설명은 200자를 초과할 수 없습니다.");
        }
    }
    
    public String getName() {
        return name != null ? name.trim() : null;
    }
    
    public String getDescription() {
        return description != null && !description.trim().isEmpty() ? description.trim() : null;
    }
}