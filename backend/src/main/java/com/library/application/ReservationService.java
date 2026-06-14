package com.library.application;

import com.library.domain.Book;
import com.library.domain.Reservation;
import com.library.domain.User;
import com.library.infrastructure.BookRepository;
import com.library.infrastructure.ReservationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;
    private final AuditLogService auditLogService;
    private final MailService mailService;

    public ReservationService(ReservationRepository reservationRepository, BookRepository bookRepository,
                              AuditLogService auditLogService, MailService mailService) {
        this.reservationRepository = reservationRepository;
        this.bookRepository = bookRepository;
        this.auditLogService = auditLogService;
        this.mailService = mailService;
    }

    @Transactional
    public Reservation reserveBook(User user, Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found."));

        if (book.getStockAvailable() > 0) {
            throw new IllegalStateException("Book is currently available in stock. Please borrow it directly.");
        }

        // Create reservation valid for 7 days
        Instant now = Instant.now();
        Instant expiresAt = now.plus(7, ChronoUnit.DAYS);

        Reservation reservation = Reservation.builder()
                .user(user)
                .book(book)
                .reservedAt(now)
                .expiresAt(expiresAt)
                .status("PENDING")
                .build();

        Reservation saved = reservationRepository.save(reservation);
        auditLogService.log(user.getId(), user.getEmail(), "BOOK_RESERVE", "Book", book.getId(), 
                "Reserved book: " + book.getTitle() + " (Reservation ID: " + saved.getId() + ")");
        return saved;
    }

    @Transactional
    public void cancelReservation(Long reservationId, User user) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found."));

        if (!reservation.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only cancel your own reservations.");
        }

        if (!"PENDING".equals(reservation.getStatus())) {
            throw new IllegalStateException("This reservation cannot be cancelled as it is already " + reservation.getStatus());
        }

        reservation.setStatus("CANCELLED");
        reservationRepository.save(reservation);
        auditLogService.log(user.getId(), user.getEmail(), "RESERVATION_CANCEL", "Book", reservation.getBook().getId(), 
                "Cancelled reservation: " + reservation.getBook().getTitle());
    }

    @Transactional(readOnly = true)
    public List<Reservation> getReservationsForUser(Long userId) {
        return reservationRepository.findByUserId(userId);
    }

    /**
     * Daily Cron Job at 1:00 AM to check expired reservations.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void cleanupExpiredReservations() {
        List<Reservation> expired = reservationRepository.findExpiredReservations();
        for (Reservation r : expired) {
            r.setStatus("EXPIRED");
            reservationRepository.save(r);
            
            // Send email notification to the user
            mailService.sendReservationExpiredEmail(r.getUser().getEmail(), r.getBook().getTitle());
            
            auditLogService.log(r.getUser().getId(), r.getUser().getEmail(), "RESERVATION_EXPIRE", "Book", r.getBook().getId(), 
                    "Reservation expired for book: " + r.getBook().getTitle());
        }
    }
}
