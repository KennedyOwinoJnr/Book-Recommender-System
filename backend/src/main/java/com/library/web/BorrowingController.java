package com.library.web;

import com.library.application.BorrowingService;
import com.library.application.UserService;
import com.library.domain.Borrowing;
import com.library.domain.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/borrowings")
public class BorrowingController {

    private final BorrowingService borrowingService;
    private final UserService userService;

    public BorrowingController(BorrowingService borrowingService, UserService userService) {
        this.borrowingService = borrowingService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<BorrowingDto> borrowBook(@RequestBody Map<String, Long> body,
                                                   @AuthenticationPrincipal UserDetails principal) {
        User user = userService.getUserByUsername(principal.getUsername());
        Long bookId = body.get("bookId");
        Borrowing borrowing = borrowingService.borrowBook(user, bookId);
        return ResponseEntity.ok(Mapper.toDto(borrowing));
    }

    @PutMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BorrowingDto> returnBook(@PathVariable("id") Long id,
                                                   @AuthenticationPrincipal UserDetails actorPrincipal) {
        User actor = userService.getUserByUsername(actorPrincipal.getUsername());
        Borrowing borrowing = borrowingService.returnBook(id, actor.getId(), actor.getEmail());
        return ResponseEntity.ok(Mapper.toDto(borrowing));
    }

    @GetMapping("/me/active")
    public ResponseEntity<List<BorrowingDto>> getMyActiveBorrowings(@AuthenticationPrincipal UserDetails principal) {
        User user = userService.getUserByUsername(principal.getUsername());
        List<Borrowing> active = borrowingService.getActiveBorrowingsForUser(user.getId());
        return ResponseEntity.ok(active.stream().map(Mapper::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/me/history")
    public ResponseEntity<List<BorrowingDto>> getMyBorrowingHistory(@AuthenticationPrincipal UserDetails principal) {
        User user = userService.getUserByUsername(principal.getUsername());
        List<Borrowing> history = borrowingService.getAllBorrowingsForUser(user.getId());
        return ResponseEntity.ok(history.stream().map(Mapper::toDto).collect(Collectors.toList()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<BorrowingDto>> getAllActiveBorrowings() {
        List<Borrowing> active = borrowingService.getAllActiveBorrowings();
        return ResponseEntity.ok(active.stream().map(Mapper::toDto).collect(Collectors.toList()));
    }
}
