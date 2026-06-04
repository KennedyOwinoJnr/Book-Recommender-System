package com.library.web;

import com.library.application.ReservationService;
import com.library.application.UserService;
import com.library.domain.Reservation;
import com.library.domain.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reservations")
public class ReservationController {

    private final ReservationService reservationService;
    private final UserService userService;

    public ReservationController(ReservationService reservationService, UserService userService) {
        this.reservationService = reservationService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<ReservationDto> reserveBook(@RequestBody Map<String, Long> body,
                                                      @AuthenticationPrincipal UserDetails principal) {
        User user = userService.getUserByUsername(principal.getUsername());
        Long bookId = body.get("bookId");
        Reservation reservation = reservationService.reserveBook(user, bookId);
        return ResponseEntity.ok(Mapper.toDto(reservation));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, String>> cancelReservation(@PathVariable("id") Long id,
                                                                 @AuthenticationPrincipal UserDetails principal) {
        User user = userService.getUserByUsername(principal.getUsername());
        reservationService.cancelReservation(id, user);
        return ResponseEntity.ok(Map.of("message", "Reservation cancelled successfully."));
    }

    @GetMapping("/me")
    public ResponseEntity<List<ReservationDto>> getMyReservations(@AuthenticationPrincipal UserDetails principal) {
        User user = userService.getUserByUsername(principal.getUsername());
        List<Reservation> list = reservationService.getReservationsForUser(user.getId());
        return ResponseEntity.ok(list.stream().map(Mapper::toDto).collect(Collectors.toList()));
    }
}
