package com.crimecat.backend.location.repository;

import com.crimecat.backend.location.domain.LocationMapping;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LocationMappingRepository extends JpaRepository<LocationMapping, UUID> {
    
    Optional<LocationMapping> findByKeywordAndIsActiveTrue(String keyword);
    
    Optional<LocationMapping> findByKeyword(String keyword);
    
    boolean existsByKeyword(String keyword);
    
    List<LocationMapping> findAllByIsActiveTrue();
    
    Page<LocationMapping> findAllByOrderByKeywordAsc(Pageable pageable);
    
    // 키워드 또는 정규화된 주소로 검색
    @Query("SELECT lm FROM LocationMapping lm WHERE lm.isActive = true AND " +
           "(LOWER(lm.keyword) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(lm.normalized) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<LocationMapping> searchByKeywordOrNormalized(@Param("searchTerm") String searchTerm);
    
    // 키워드 또는 정규화된 주소로 검색 (페이징 지원)
    @Query("SELECT lm FROM LocationMapping lm WHERE " +
           "(LOWER(lm.keyword) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(lm.normalized) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY lm.keyword ASC")
    Page<LocationMapping> searchByKeywordOrNormalized(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // 관련 키워드나 오타 변형에서 검색
    @Query(value = "SELECT * FROM location_mappings WHERE is_active = true AND " +
           "(JSON_SEARCH(related_keywords, 'one', :searchTerm) IS NOT NULL OR " +
           "JSON_SEARCH(typo_variants, 'one', :searchTerm) IS NOT NULL)", 
           nativeQuery = true)
    List<LocationMapping> findByRelatedKeywordsOrTypoVariants(@Param("searchTerm") String searchTerm);
    
    // 모든 가능한 키워드로 매핑 찾기
    @Query("SELECT lm FROM LocationMapping lm WHERE lm.isActive = true AND " +
           "(LOWER(lm.keyword) = LOWER(:searchTerm) OR " +
           "LOWER(lm.normalized) = LOWER(:searchTerm))")
    Optional<LocationMapping> findByAnyKeyword(@Param("searchTerm") String searchTerm);
}