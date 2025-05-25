package com.crimecat.backend.webUser.dto;

import lombok.Getter;

@Getter
public class NotificationToggleRequest {
  private Boolean enabled;

  public Boolean getEnabled() { return enabled; }
  public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}
