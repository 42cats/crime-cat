package com.crimecat.backend.admin.service;

import com.crimecat.backend.config.CacheNames;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.notice.domain.Notice;
import com.crimecat.backend.notice.dto.NoticeReorderRequestDto;
import com.crimecat.backend.notice.dto.NoticeRequestDto;
import com.crimecat.backend.notice.repository.NoticeRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

  private final NoticeRepository noticeRepository;

  @Transactional
  @CacheEvict(value = CacheNames.ALL_NOTICES, allEntries = true, cacheManager = "caffeineCacheManager")
  public void addNotice(NoticeRequestDto noticeRequestDto) {
    try{
      Notice notice = Notice.builder()
          .title(noticeRequestDto.getTitle())
          .content(noticeRequestDto.getContent())
          .noticeType(noticeRequestDto.getNoticeType())
          .summary(noticeRequestDto.getSummary())
          .isPinned(noticeRequestDto.getIsPinned())
          .build();
      noticeRepository.save(notice);
      } catch (Exception e) {
        throw ErrorStatus.INVALID_INPUT.asServiceException();
    }
  }

  @Transactional
  @CacheEvict(value = CacheNames.ALL_NOTICES, allEntries = true, cacheManager = "caffeineCacheManager")
  public void patchNotice(UUID uuid, NoticeRequestDto noticeRequestDto){
      Notice notice = noticeRepository.findById(uuid)
          .orElseThrow(ErrorStatus.RESOURCE_NOT_FOUND::asServiceException);
    try{
      notice.setNoticeType(noticeRequestDto.getNoticeType());
      notice.setSummary(noticeRequestDto.getSummary());
      notice.setContent(noticeRequestDto.getContent());
      notice.setTitle(noticeRequestDto.getTitle());
      notice.setIsPinned(noticeRequestDto.getIsPinned());

      noticeRepository.save(notice);

    }
    catch (Exception e) {
          throw ErrorStatus.INVALID_INPUT.asServiceException();
    }
  }

  @Transactional
  @CacheEvict(value = CacheNames.ALL_NOTICES, allEntries = true, cacheManager = "caffeineCacheManager")
  public void deleteNotice(UUID uuid) {
    noticeRepository.deleteById(uuid);
  }

  @Transactional
  @CacheEvict(value = CacheNames.ALL_NOTICES, allEntries = true, cacheManager = "caffeineCacheManager")
  public void reorderNotice(List<NoticeReorderRequestDto> noticeReorderRequestDtoList) {

    for (NoticeReorderRequestDto noticeReorderRequestDto : noticeReorderRequestDtoList) {
      UUID uuid = UUID.fromString(noticeReorderRequestDto.getUuid());
      Notice notice = noticeRepository.findById(uuid)
          .orElseThrow(ErrorStatus.RESOURCE_NOT_FOUND::asServiceException);
      if(noticeReorderRequestDto.getIsPinned()){
        notice.setOrderIdx(noticeReorderRequestDto.getOrderIdx());
      }
      else{
        notice.setIsPinned(false);
        notice.setOrderIdx(0);
      }
    }
  }
}
