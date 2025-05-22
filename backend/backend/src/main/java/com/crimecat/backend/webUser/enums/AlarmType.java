package com.crimecat.backend.webUser.enums;

import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.dto.NotificationSettingsRequestDto;

public enum AlarmType {

    EMAIL {
        @Override
        public void apply(WebUser webUser, NotificationSettingsRequestDto dto) {
            webUser.setEmailAlarm(dto.getEmail());
        }
    },
    DISCORD {
        @Override
        public void apply(WebUser webUser, NotificationSettingsRequestDto dto) {
            if (webUser.getUser() != null && webUser.getUser().getDiscordUser() != null) {
                webUser.getUser().getDiscordUser().setDiscordAlarm(dto.getDiscord());
            }
        }
    },
    POST {
        @Override
        public void apply(WebUser webUser, NotificationSettingsRequestDto dto) {
            webUser.setPostAlarm(dto.getPost());
        }
    },
    COMMENT {
        @Override
        public void apply(WebUser webUser, NotificationSettingsRequestDto dto) {
            webUser.setPostComment(dto.getComment());
        }
    },
    COMMENT_COMMENT {
        @Override
        public void apply(WebUser webUser, NotificationSettingsRequestDto dto) {
            webUser.setCommentComment(dto.getCommentComment());
        }
    };

    public abstract void apply(WebUser webUser, NotificationSettingsRequestDto dto);
}
