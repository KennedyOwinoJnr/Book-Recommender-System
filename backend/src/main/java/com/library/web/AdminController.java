package com.library.web;

import com.library.application.AuditLogService;
import com.library.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    private final AuditLogService auditLogService;
    private final JdbcTemplate jdbcTemplate;

    public AdminController(AuditLogService auditLogService, JdbcTemplate jdbcTemplate) {
        this.auditLogService = auditLogService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getDashboardAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        // Get total counts
        Long totalBooks = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM books", Long.class);
        Long totalUsers = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE username LIKE 'user_%'", Long.class);
        Long totalMembers = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Long.class);
        Long activeBorrowings = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM borrowings WHERE status IN ('ACTIVE', 'OVERDUE')", Long.class);
        Long overdueBorrowings = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM borrowings WHERE status = 'OVERDUE' OR (status = 'ACTIVE' AND due_date < CURRENT_TIMESTAMP)", Long.class);

        analytics.put("totalBooks", totalBooks);
        analytics.put("totalSystemUsers", totalMembers);
        analytics.put("totalImportedUsers", totalUsers);
        analytics.put("activeBorrowings", activeBorrowings);
        analytics.put("overdueBorrowings", overdueBorrowings);

        // Top borrowed books
        List<Map<String, Object>> topBooks = jdbcTemplate.queryForList(
                "SELECT b.title, COUNT(br.id) as borrow_count FROM borrowings br JOIN books b ON br.book_id = b.id GROUP BY b.title ORDER BY borrow_count DESC LIMIT 5"
        );
        analytics.put("topBorrowedBooks", topBooks);

        // Borrowing activity stats (last 7 days)
        List<Map<String, Object>> activityStats = jdbcTemplate.queryForList(
                "SELECT DATE(borrowed_at) as date, COUNT(*) as count FROM borrowings WHERE borrowed_at > CURRENT_DATE - INTERVAL '7 days' GROUP BY DATE(borrowed_at) ORDER BY DATE(borrowed_at) ASC"
        );
        analytics.put("borrowingActivityHistory", activityStats);

        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(auditLogService.getLogs(pageable));
    }
}
