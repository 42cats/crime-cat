package com.crimecat.backend.storage;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "custom-storage")
public class StorageProperties {

    /**
     * Folder location for storing files
     */
    @Getter
    @Setter
    @Value("${custom-storage.location}") private String location = "/images";

    // 추가: 직접 YAML 설정을 받을 필드
    private String avatarUploadDir;
    private String avatarBaseUrl;
    private String gameThemeUploadDir;
    private String gameThemeBaseUrl;

    private StorageFileType avatar = StorageFileType.AVATAR;
    private StorageFileType gameTheme = StorageFileType.GAME_THEME;

    @PostConstruct
    public void initEnum(){
        // 직접 설정한 필드를 사용하여 enum 초기화
        StorageFileType.AVATAR.init(avatarUploadDir, avatarBaseUrl);
        StorageFileType.GAME_THEME.init(gameThemeUploadDir, gameThemeBaseUrl);
    }

    // getter/setter for new fields
    public String getAvatarUploadDir() {
        return avatarUploadDir;
    }

    public void setAvatarUploadDir(String avatarUploadDir) {
        this.avatarUploadDir = avatarUploadDir;
    }

    public String getAvatarBaseUrl() {
        return avatarBaseUrl;
    }

    public void setAvatarBaseUrl(String avatarBaseUrl) {
        this.avatarBaseUrl = avatarBaseUrl;
    }

    public String getGameThemeUploadDir() {
        return gameThemeUploadDir;
    }

    public void setGameThemeUploadDir(String gameThemeUploadDir) {
        this.gameThemeUploadDir = gameThemeUploadDir;
    }

    public String getGameThemeBaseUrl() {
        return gameThemeBaseUrl;
    }

    public void setGameThemeBaseUrl(String gameThemeBaseUrl) {
        this.gameThemeBaseUrl = gameThemeBaseUrl;
    }
}