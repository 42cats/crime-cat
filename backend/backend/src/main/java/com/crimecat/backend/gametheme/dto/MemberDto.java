package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.MakerTeamMember;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;
import java.util.Optional;

@Getter
@Builder
@AllArgsConstructor
public class MemberDto {
    private UUID id;
    private UUID userId;
    private String name;
    private boolean isLeader;
    private String avatarUrl;

    public static MemberDto from(MakerTeamMember member) {
        return MemberDto.builder()
                .id(member.getId())
                .name(member.getName())
                .isLeader(member.isLeader())
                .userId(member.getWebUser().getId())
                .build();
    }
    
    public static MemberDto fromWithAvatar(MakerTeamMember member, WebUserRepository webUserRepository) {
        String avatarUrl = null;
        if (member.getWebUser().getId() != null) {
            Optional<WebUser> webUserOpt = webUserRepository.findById(member.getWebUser().getId());
            if (webUserOpt.isPresent()) {
                avatarUrl = webUserOpt.get().getProfileImagePath();
            }
        }
        
        return MemberDto.builder()
                .id(member.getId())
                .name(member.getName())
                .isLeader(member.isLeader())
                .userId(member.getWebUser().getId())
                .avatarUrl(avatarUrl)
                .build();
    }
}
