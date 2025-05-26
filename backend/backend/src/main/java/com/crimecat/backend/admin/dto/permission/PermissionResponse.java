package com.crimecat.backend.admin.dto.permission;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionResponse {
    private String id;
    private String name;
    private Integer price;
    private Integer duration;
    private String info;
    private String message;
    
    public PermissionResponse(String id, String name, Integer price, Integer duration, String info) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.duration = duration;
        this.info = info;
    }
}
