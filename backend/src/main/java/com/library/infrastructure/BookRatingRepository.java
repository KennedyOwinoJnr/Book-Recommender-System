package com.library.infrastructure;

import com.library.domain.BookRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookRatingRepository extends JpaRepository<BookRating, Long> {
    Optional<BookRating> findByUserIdAndBookId(Long userId, Long bookId);

    @Query("SELECT AVG(br.rating) FROM BookRating br WHERE br.book.id = :bookId")
    Double getAverageRating(@Param("bookId") Long bookId);

    List<BookRating> findByUserId(Long userId);
}
