package com.crimecat.backend.notification.sort;

import com.crimecat.backend.utils.sort.SortType;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;

public enum NotificationSortType implements SortType {
  LATEST(Sort.by(Sort.Direction.DESC, "createdAt")),
  OLDEST(Sort.by(Direction.ASC, "createdAt")),
  TYPE(Sort.by(Direction.ASC, "type")),
  STATUS(Sort.by(Direction.ASC, "status")),
  UNREAD_FIRST(Sort.by(Direction.ASC, "status").and(Sort.by(Direction.DESC, "createdAt"))),
  SYSTEM_FIRST(Sort.by(Direction.ASC, "sender.id").and(Sort.by(Direction.DESC, "createdAt"))), // 시스템 알림 먼저
  USER_FIRST(Sort.by(Direction.DESC, "sender.id").and(Sort.by(Direction.DESC, "createdAt"))), // 사용자 알림 먼저
  TYPE_AND_TIME(Sort.by(Direction.ASC, "type").and(Sort.by(Direction.DESC, "createdAt"))), // 타입별 + 시간순
  GAME_RECORD_FIRST(Sort.by("type").and(Sort.by(Direction.DESC, "createdAt"))); // 게임 기록 먼저 (타입 정렬 + 시간순)

  private final Sort sort;

  NotificationSortType(Sort sort) {
    this.sort = sort;
  }

  @Override
  public Sort getSort() {
    return sort;
  }
}
