package com.crimecat.backend.point.repository;

import com.crimecat.backend.point.domain.PointHistory;
import com.crimecat.backend.point.domain.TransactionType;
import com.crimecat.backend.user.domain.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PointHistoryRepository extends JpaRepository<PointHistory, UUID>, JpaSpecificationExecutor<PointHistory> {

    Page<PointHistory> findByUserOrderByUsedAtDesc(User user, Pageable pageable);

    Page<PointHistory> findByUserAndTypeOrderByUsedAtDesc(User user, TransactionType type, Pageable pageable);

    @Query("SELECT COALESCE(SUM(ph.amount), 0) " +
           "FROM PointHistory ph WHERE ph.user = :user AND ph.type IN :types")
    Optional<Integer> sumAmountByUserAndTypes(
        @Param("user") User user,
        @Param("types") List<TransactionType> types
    );
}
