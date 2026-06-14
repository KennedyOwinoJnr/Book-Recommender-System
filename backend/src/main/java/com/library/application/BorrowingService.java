package com.library.application;

import com.library.domain.Book;
import com.library.domain.Borrowing;
import com.library.domain.Reservation;
import com.library.domain.User;
import com.library.infrastructure.BookRepository;
import com.library.infrastructure.BorrowingRepository;
import com.library.infrastructure.ReservationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class BorrowingService {

    private static final int MAX_ACTIVE_BORROWS = 5;
    private static final BigDecimal FINE_PER_DAY = new BigDecimal("0.50");

    private final BorrowingRepository borrowingRepository;
    private final BookRepository bookRepository;
    private final ReservationRepository reservationRepository;
    private final AuditLogService auditLogService;
    private final MailService mailService;

    public BorrowingService(BorrowingRepository borrowingRepository, BookRepository bookRepository,
                            ReservationRepository reservationRepository, AuditLogService auditLogService,
                            MailService mailService) {
        this.borrowingRepository = borrowingRepository;
        this.bookRepository = bookRepository;
        this.reservationRepository = reservationRepository;
        this.auditLogService = auditLogService;
        this.mailService = mailService;
    }

    @Transactional
    public Borrowing borrowBook(User user, Long bookId) {
        // Enforce borrowing limits
        long activeCount = borrowingRepository.countActiveByUserId(user.getId());
        if (activeCount >= MAX_ACTIVE_BORROWS) {
            throw new IllegalStateException("User has reached the maximum borrowing limit of " + MAX_ACTIVE_BORROWS + " books.");
        }

        // 2. Check book availability
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found."));

        if (book.getStockAvailable() <= 0) {
            throw new IllegalStateException("Book is currently out of stock. You can place a reservation instead.");
        }

        // 4. Create borrowing entry (default 14 days loan period)
        Instant now = Instant.now();
        Instant dueDate = now.plus(14, ChronoUnit.DAYS);

        Borrowing borrowing = Borrowing.builder()
                .user(user)
                .book(book)
                .borrowedAt(now)
                .dueDate(dueDate)
                .status("ACTIVE")
                .fineAmount(BigDecimal.ZERO)
                .build();

        Borrowing saved = borrowingRepository.save(borrowing);

        // Transition any FULFILLED reservation for this user and book to COMPLETED
        List<Reservation> userHolds = reservationRepository.findByUserIdAndBookIdAndStatus(user.getId(), book.getId(), "FULFILLED");
        for (Reservation res : userHolds) {
            res.setStatus("COMPLETED");
            reservationRepository.save(res);
        }

        // Recalculate book stock dynamically: stockTotal - (activeLoans + activeHolds)
        long activeLoans = borrowingRepository.countByBookIdAndStatusIn(book.getId(), List.of("ACTIVE", "OVERDUE"));
        long activeHolds = reservationRepository.countByBookIdAndStatus(book.getId(), "FULFILLED");
        book.setStockAvailable(Math.max(0, book.getStockTotal() - (int)(activeLoans + activeHolds)));
        bookRepository.save(book);

        auditLogService.log(user.getId(), user.getEmail(), "BOOK_BORROW", "Book", book.getId(), 
                "Borrowed book: " + book.getTitle() + " (Borrowing ID: " + saved.getId() + ")");
        return saved;
    }

    @Transactional
    public Borrowing returnBook(Long borrowingId, Long actorId, String actorEmail) {
        Borrowing borrowing = borrowingRepository.findByIdWithAssociations(borrowingId)
                .orElseThrow(() -> new IllegalArgumentException("Borrowing record not found with id: " + borrowingId));

        if (!"ACTIVE".equals(borrowing.getStatus()) && !"OVERDUE".equals(borrowing.getStatus())) {
            throw new IllegalStateException("This borrowing transaction is already closed.");
        }

        Instant now = Instant.now();
        borrowing.setReturnedAt(now);

        // Calculate fine if overdue
        BigDecimal fine = calculateFine(borrowing.getDueDate(), now);
        if (fine.compareTo(BigDecimal.ZERO) > 0) {
            borrowing.setFineAmount(fine);
            borrowing.setStatus("RETURNED_WITH_FINE");
        } else {
            borrowing.setStatus("RETURNED");
        }
        Borrowing saved = borrowingRepository.save(borrowing);

        Book book = borrowing.getBook();

        // Trigger reservation check to see if we can fulfill a pending hold
        checkAndFulfillReservation(book);

        // Recalculate book stock dynamically: stockTotal - (activeLoans + activeHolds)
        long activeLoans = borrowingRepository.countByBookIdAndStatusIn(book.getId(), List.of("ACTIVE", "OVERDUE"));
        long activeHolds = reservationRepository.countByBookIdAndStatus(book.getId(), "FULFILLED");
        book.setStockAvailable(Math.max(0, book.getStockTotal() - (int)(activeLoans + activeHolds)));
        bookRepository.save(book);

        auditLogService.log(actorId, actorEmail, "BOOK_RETURN", "Book", book.getId(), 
                "Returned book: " + book.getTitle() + " (Borrowing ID: " + saved.getId() + ", Fine: $" + fine + ")");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Borrowing> getActiveBorrowingsForUser(Long userId) {
        return borrowingRepository.findActiveByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Borrowing> getAllBorrowingsForUser(Long userId) {
        return borrowingRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Borrowing> getAllActiveBorrowings() {
        return borrowingRepository.findAllActive();
    }

    /**
     * Daily Cron Job at midnight to check overdue books and calculate penalties.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void processOverdueFines() {
        List<Borrowing> activeOrOverdue = borrowingRepository.findAllActive();
        Instant now = Instant.now();
        
        for (Borrowing b : activeOrOverdue) {
            if (now.isAfter(b.getDueDate())) {
                b.setStatus("OVERDUE");
                BigDecimal fine = calculateFine(b.getDueDate(), now);
                b.setFineAmount(fine);
                borrowingRepository.save(b);
            } else if ("ACTIVE".equals(b.getStatus())) {
                long daysRemaining = ChronoUnit.DAYS.between(now, b.getDueDate());
                if (daysRemaining == 3) {
                    mailService.sendBorrowingDueReminder(b.getUser().getEmail(), b.getBook().getTitle(), daysRemaining);
                }
            }
        }
    }

    private BigDecimal calculateFine(Instant dueDate, Instant returnedDate) {
        if (returnedDate.isBefore(dueDate)) {
            return BigDecimal.ZERO;
        }
        long days = Duration.between(dueDate, returnedDate).toDays();
        if (days <= 0) return BigDecimal.ZERO;
        return FINE_PER_DAY.multiply(new BigDecimal(days));
    }

    private void checkAndFulfillReservation(Book book) {
        List<Reservation> pending = reservationRepository.findPendingByBookIdOrderByReservedAtAsc(book.getId());
        if (!pending.isEmpty()) {
            // Assign book to the first reservation request
            Reservation res = pending.get(0);
            res.setStatus("FULFILLED");
            reservationRepository.save(res);

            // In production, we'd send an email to notify user they have 48 hours to collect
            auditLogService.log(res.getUser().getId(), res.getUser().getEmail(), "RESERVATION_FULFILL", "Book", book.getId(), 
                    "Reservation automatically fulfilled. Book held for user: " + res.getUser().getUsername());
        }
    }
}
