package com.crimecat.backend.location.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.location.domain.LocationMapping;
import com.crimecat.backend.location.dto.LocationMappingDto;
import com.crimecat.backend.location.dto.LocationMappingRequest;
import com.crimecat.backend.location.dto.LocationMappingResponse;
import com.crimecat.backend.location.repository.LocationMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocationMappingService {
    
    private final LocationMappingRepository locationMappingRepository;
    
    /**
     * 키워드로 정규화된 주소 조회
     */
    ////@Cacheable(value = CacheType.LOCATION_MAPPING, key = "#keyword")
    public Optional<LocationMappingDto> findByKeyword(String keyword) {
        return locationMappingRepository.findByKeywordAndIsActiveTrue(keyword)
                .map(LocationMappingDto::from);
    }
    
    /**
     * 검색어로 관련된 모든 정규화된 주소 조회
     */
    ////@Cacheable(value = CacheType.LOCATION_SEARCH, key = "#searchTerm")
    public List<String> getNormalizedAddresses(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        Set<String> normalizedAddresses = new HashSet<>();
        
        // 1. 직접 키워드 매칭
        locationMappingRepository.findByKeywordAndIsActiveTrue(searchTerm)
                .ifPresent(mapping -> {
                    normalizedAddresses.add(mapping.getNormalized());
                    // 연관 키워드의 정규화된 주소도 추가
                    mapping.getRelatedKeywords().forEach(relatedKeyword -> 
                        locationMappingRepository.findByKeywordAndIsActiveTrue(relatedKeyword)
                                .ifPresent(relatedMapping -> normalizedAddresses.add(relatedMapping.getNormalized()))
                    );
                });
        
        // 2. 부분 매칭 검색
        locationMappingRepository.searchByKeywordOrNormalized(searchTerm)
                .forEach(mapping -> normalizedAddresses.add(mapping.getNormalized()));
        
        // 3. 관련 키워드나 오타 변형에서 검색
        locationMappingRepository.findByRelatedKeywordsOrTypoVariants(searchTerm)
                .forEach(mapping -> normalizedAddresses.add(mapping.getNormalized()));
        
        return new ArrayList<>(normalizedAddresses);
    }
    
    /**
     * 검색어에 대한 모든 관련 검색어 반환 (확장된 검색을 위해)
     */
    public List<String> getExpandedSearchTerms(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return Collections.singletonList(searchTerm);
        }
        
        Set<String> expandedTerms = new HashSet<>();
        expandedTerms.add(searchTerm);
        
        // 키워드로 매핑 찾기
        locationMappingRepository.findByAnyKeyword(searchTerm).ifPresent(mapping -> {
            expandedTerms.add(mapping.getKeyword());
            expandedTerms.add(mapping.getNormalized());
            expandedTerms.addAll(mapping.getRelatedKeywords());
        });
        
        // 관련 키워드나 오타 변형에서 찾기
        locationMappingRepository.findByRelatedKeywordsOrTypoVariants(searchTerm).forEach(mapping -> {
            expandedTerms.add(mapping.getKeyword());
            expandedTerms.add(mapping.getNormalized());
        });
        
        return new ArrayList<>(expandedTerms);
    }
    
    /**
     * 모든 활성 매핑 조회
     */
    ////@Cacheable(value = CacheType.LOCATION_ALL_MAPPINGS)
    public List<LocationMappingDto> getAllActiveMappings() {
        return locationMappingRepository.findAllByIsActiveTrue().stream()
                .map(LocationMappingDto::from)
                .collect(Collectors.toList());
    }
    
    /**
     * 페이징된 매핑 목록 조회 (관리자용)
     */
    public LocationMappingResponse getMappings(Pageable pageable) {
        Page<LocationMappingDto> page = locationMappingRepository.findAllByOrderByKeywordAsc(pageable)
                .map(LocationMappingDto::from);
        return LocationMappingResponse.from(page);
    }
    
    /**
     * 검색 조건이 포함된 페이징된 매핑 목록 조회 (관리자용)
     */
    public LocationMappingResponse getMappings(Pageable pageable, String search) {
        Page<LocationMapping> page;
        
        if (search != null && !search.trim().isEmpty()) {
            page = locationMappingRepository.searchByKeywordOrNormalized(search.trim(), pageable);
        } else {
            page = locationMappingRepository.findAllByOrderByKeywordAsc(pageable);
        }
        
        Page<LocationMappingDto> dtoPage = page.map(LocationMappingDto::from);
        return LocationMappingResponse.from(dtoPage);
    }
    
    /**
     * 매핑 생성
     */
    @Transactional
    ////@CacheEvict(value = {CacheType.LOCATION_MAPPING, CacheType.LOCATION_SEARCH, CacheType.LOCATION_ALL_MAPPINGS}, allEntries = true)
    public LocationMappingDto createMapping(LocationMappingRequest request) {
        // 중복 체크
        if (locationMappingRepository.existsByKeyword(request.getKeyword())) {
            throw ErrorStatus.DUPLICATE_LOCATION_KEYWORD.asServiceException();
        }
        
        LocationMapping mapping = LocationMapping.builder()
                .keyword(request.getKeyword())
                .normalized(request.getNormalized())
                .relatedKeywords(request.getRelatedKeywords() != null ? request.getRelatedKeywords() : new ArrayList<>())
                .typoVariants(request.getTypoVariants() != null ? request.getTypoVariants() : new ArrayList<>())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .description(request.getDescription())
                .build();
        
        LocationMapping saved = locationMappingRepository.save(mapping);
        log.info("Location mapping created - keyword: {}, normalized: {}", saved.getKeyword(), saved.getNormalized());
        
        return LocationMappingDto.from(saved);
    }
    
    /**
     * 매핑 수정
     */
    @Transactional
    ////@CacheEvict(value = {CacheType.LOCATION_MAPPING, CacheType.LOCATION_SEARCH, CacheType.LOCATION_ALL_MAPPINGS}, allEntries = true)
    public LocationMappingDto updateMapping(UUID id, LocationMappingRequest request) {
        LocationMapping mapping = locationMappingRepository.findById(id)
                .orElseThrow(ErrorStatus.LOCATION_MAPPING_NOT_FOUND::asServiceException);
        
        // 키워드 변경 시 중복 체크
        if (!mapping.getKeyword().equals(request.getKeyword()) && 
            locationMappingRepository.existsByKeyword(request.getKeyword())) {
            throw ErrorStatus.DUPLICATE_LOCATION_KEYWORD.asServiceException();
        }
        
        mapping.setKeyword(request.getKeyword());
        mapping.setNormalized(request.getNormalized());
        mapping.setRelatedKeywords(request.getRelatedKeywords() != null ? request.getRelatedKeywords() : new ArrayList<>());
        mapping.setTypoVariants(request.getTypoVariants() != null ? request.getTypoVariants() : new ArrayList<>());
        mapping.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        mapping.setDescription(request.getDescription());
        
        LocationMapping updated = locationMappingRepository.save(mapping);
        log.info("Location mapping updated - id: {}, keyword: {}", id, updated.getKeyword());
        
        return LocationMappingDto.from(updated);
    }
    
    /**
     * 매핑 삭제
     */
    @Transactional
    ////@CacheEvict(value = {CacheType.LOCATION_MAPPING, CacheType.LOCATION_SEARCH, CacheType.LOCATION_ALL_MAPPINGS}, allEntries = true)
    public void deleteMapping(UUID id) {
        LocationMapping mapping = locationMappingRepository.findById(id)
                .orElseThrow(ErrorStatus.LOCATION_MAPPING_NOT_FOUND::asServiceException);
        
        locationMappingRepository.delete(mapping);
        log.info("Location mapping deleted - id: {}, keyword: {}", id, mapping.getKeyword());
    }
    
    /**
     * 매핑 상세 조회
     */
    public LocationMappingDto getMapping(UUID id) {
        return locationMappingRepository.findById(id)
                .map(LocationMappingDto::from)
                .orElseThrow(ErrorStatus.LOCATION_MAPPING_NOT_FOUND::asServiceException);
    }
}