package com.crimecat.backend.advertisement.repository;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ThemeAdvertisementRepository extends JpaRepository<ThemeAdvertisement, UUID> {
    
    @Query("SELECT ta FROM ThemeAdvertisement ta " +
           "WHERE ta.isActive = true " +
           "AND ta.startDate <= :now " +
           "AND ta.endDate >= :now " +
           "ORDER BY ta.displayOrder ASC")
    List<ThemeAdvertisement> findActiveAdvertisements(@Param("now") LocalDateTime now);
    
    @Query("SELECT ta FROM ThemeAdvertisement ta " +
           "ORDER BY ta.displayOrder ASC")
    List<ThemeAdvertisement> findAllOrderByDisplayOrder();
    
    @Query("SELECT COALESCE(MAX(ta.displayOrder), 0) FROM ThemeAdvertisement ta")
    Integer findMaxDisplayOrder();
    
    boolean existsByThemeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
        UUID themeId, LocalDateTime endDate, LocalDateTime startDate);
}
