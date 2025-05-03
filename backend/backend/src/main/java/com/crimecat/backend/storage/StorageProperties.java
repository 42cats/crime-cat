package com.crimecat.backend.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "custom-storage")
public class StorageProperties {

    /**
     * Folder location for storing files
     */
    @Value("location") private String location = "/frontend/content/image";

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

}
