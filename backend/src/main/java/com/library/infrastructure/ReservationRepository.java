package com.library.infrastructure;

import com.library.domain.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // JOIN FETCH user and book so the mapper never hits a closed session
    @Query("SELECT r FROM Reservation r JOIN FETCH r.user JOIN FETCH r.book WHERE r.user.id = :userId")
    List<Reservation> findByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM Reservation r JOIN FETCH r.user JOIN FETCH r.book WHERE r.book.id = :bookId AND r.status = 'PENDING' ORDER BY r.reservedAt ASC")
    List<Reservation> findPendingByBookIdOrderByReservedAtAsc(@Param("bookId") Long bookId);

    @Query("SELECT r FROM Reservation r JOIN FETCH r.user JOIN FETCH r.book WHERE r.status = 'PENDING' AND r.expiresAt < CURRENT_TIMESTAMP")
    List<Reservation> findExpiredReservations();
}
