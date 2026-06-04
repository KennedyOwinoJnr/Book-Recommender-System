package com.library.infrastructure;

import com.library.domain.Borrowing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowingRepository extends JpaRepository<Borrowing, Long> {
    List<Borrowing> findByUserId(Long userId);

    @Query("SELECT b FROM Borrowing b WHERE b.user.id = :userId AND b.status IN ('ACTIVE', 'OVERDUE')")
    List<Borrowing> findActiveByUserId(@Param("userId") Long userId);

    @Query("SELECT b FROM Borrowing b WHERE b.status IN ('ACTIVE', 'OVERDUE')")
    List<Borrowing> findAllActive();

    @Query("SELECT b FROM Borrowing b WHERE b.status = 'OVERDUE' OR (b.status = 'ACTIVE' AND b.dueDate < CURRENT_TIMESTAMP)")
    List<Borrowing> findOverdueBorrowings();

    Optional<Borrowing> findByUserIdAndBookIdAndStatusIn(Long userId, Long bookId, List<String> statuses);

    @Query("SELECT COUNT(b) FROM Borrowing b WHERE b.user.id = :userId AND b.status IN ('ACTIVE', 'OVERDUE')")
    long countActiveByUserId(@Param("userId") Long userId);
}
