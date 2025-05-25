package com.crimecat.backend.point.repository;

import com.crimecat.backend.point.domain.PointHistory;
import com.crimecat.backend.point.domain.TransactionType;
import com.crimecat.backend.user.domain.User;

import java.time.LocalDateTime;
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

    // 급속 포인트 획득 감지 - 1시간 내 5회 이상 획득
    @Query(value = """
        WITH rapid_earnings AS (
            SELECT 
                u.id as user_id,
                wu.nickname,
                wu.email,
                COUNT(*) as transaction_count,
                SUM(ph.amount) as total_amount,
                MIN(ph.used_at) as first_transaction,
                MAX(ph.used_at) as last_transaction
            FROM point_histories ph
            JOIN users u ON ph.user_id = u.id
            JOIN web_users wu ON u.web_user_id = wu.id
            WHERE ph.used_at >= :since
            AND ph.type IN ('CHARGE', 'RECEIVE', 'COUPON', 'DAILY', 'THEME_REWARD')
            GROUP BY u.id, wu.nickname, wu.email
            HAVING COUNT(*) >= 5
            AND TIMESTAMPDIFF(MINUTE, MIN(ph.used_at), MAX(ph.used_at)) <= 60
        )
        SELECT 
            re.*,
            ph.id as transaction_id,
            ph.type,
            ph.amount,
            ph.used_at,
            ph.memo,
            wu2.nickname as related_nickname
        FROM rapid_earnings re
        JOIN point_histories ph ON ph.user_id = re.user_id
        LEFT JOIN users u2 ON ph.related_user_id = u2.id
        LEFT JOIN web_users wu2 ON u2.web_user_id = wu2.id
        WHERE ph.used_at >= re.first_transaction
        AND ph.used_at <= re.last_transaction
        ORDER BY re.total_amount DESC, ph.used_at DESC
        """, nativeQuery = true)
    List<Object[]> findRapidEarningUsers(@Param("since") LocalDateTime since);

    // 대량 포인트 획득 감지 - 24시간 내 10만 포인트 이상
    @Query(value = """
        WITH large_earnings AS (
            SELECT 
                u.id as user_id,
                wu.nickname,
                wu.email,
                COUNT(*) as transaction_count,
                SUM(ph.amount) as total_amount
            FROM point_histories ph
            JOIN users u ON ph.user_id = u.id
            JOIN web_users wu ON u.web_user_id = wu.id
            WHERE ph.used_at >= :since
            AND ph.type IN ('CHARGE', 'RECEIVE', 'COUPON', 'DAILY', 'THEME_REWARD')
            GROUP BY u.id, wu.nickname, wu.email
            HAVING SUM(ph.amount) >= 100000
        )
        SELECT 
            le.*,
            ph.id as transaction_id,
            ph.type,
            ph.amount,
            ph.used_at,
            ph.memo,
            wu2.nickname as related_nickname
        FROM large_earnings le
        JOIN point_histories ph ON ph.user_id = le.user_id
        LEFT JOIN users u2 ON ph.related_user_id = u2.id
        LEFT JOIN web_users wu2 ON u2.web_user_id = wu2.id
        WHERE ph.used_at >= :since
        AND ph.type IN ('CHARGE', 'RECEIVE', 'COUPON', 'DAILY', 'THEME_REWARD')
        ORDER BY le.total_amount DESC, ph.used_at DESC
        LIMIT 100
        """, nativeQuery = true)
    List<Object[]> findLargeAmountEarningUsers(@Param("since") LocalDateTime since);

    // 반복적인 전송 감지 - 동일 사용자 간 3회 이상 거래
    @Query(value = """
        WITH repeated_transfers AS (
            SELECT 
                u1.id as sender_id,
                wu1.nickname as sender_nickname,
                wu1.email as sender_email,
                u2.id as receiver_id,
                wu2.nickname as receiver_nickname,
                COUNT(*) as transfer_count,
                SUM(ph.amount) as total_amount
            FROM point_histories ph
            JOIN users u1 ON ph.user_id = u1.id
            JOIN web_users wu1 ON u1.web_user_id = wu1.id
            JOIN users u2 ON ph.related_user_id = u2.id
            JOIN web_users wu2 ON u2.web_user_id = wu2.id
            WHERE ph.used_at >= :since
            AND ph.type IN ('GIFT', 'RECEIVE')
            GROUP BY u1.id, wu1.nickname, wu1.email, u2.id, wu2.nickname
            HAVING COUNT(*) >= 3
        )
        SELECT 
            rt.sender_id as user_id,
            rt.sender_nickname as nickname,
            rt.sender_email as email,
            rt.transfer_count as transaction_count,
            rt.total_amount,
            ph.id as transaction_id,
            ph.type,
            ph.amount,
            ph.used_at,
            ph.memo,
            rt.receiver_nickname as related_nickname
        FROM repeated_transfers rt
        JOIN point_histories ph ON ph.user_id = rt.sender_id 
            AND ph.related_user_id = rt.receiver_id
        WHERE ph.used_at >= :since
        AND ph.type IN ('GIFT', 'RECEIVE')
        ORDER BY rt.transfer_count DESC, ph.used_at DESC
        """, nativeQuery = true)
    List<Object[]> findRepeatedTransferUsers(@Param("since") LocalDateTime since);
}
